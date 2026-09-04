from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any
import pandas as pd
import time
import os
import logging
from app.core.database import get_db
from app.core.security import rate_limiter
from app.models.database import ReconciliationRun, Transaction, Match, ExceptionRecord, ReviewDecision
from app.services.ingestion.processor import CSVProcessor
from app.services.reconciliation.orchestrator import ReconciliationOrchestrator
from app.services.reporting.dashboard import DashboardService
from app.services.reporting.report_generator import ReportGenerator
from app.services.reporting.intelligence import ExceptionIntelligenceService
from app.services.benchmarking.runner import BenchmarkRunner
from app.schemas.reconciliation import FileUploadResponse, DashboardMetrics, MatchSchema, ReviewAction, RunIntelligence
from app.services.ai.copilot import ReconciliationCopilot

router = APIRouter()
processor = CSVProcessor()
orchestrator = ReconciliationOrchestrator()
dashboard_service = DashboardService()
intelligence_service = ExceptionIntelligenceService()
report_generator = ReportGenerator()
benchmark_runner = BenchmarkRunner()
copilot = ReconciliationCopilot(orchestrator.ai_service)
logger = logging.getLogger(__name__)

def get_project_root():
    current = os.path.abspath(os.getcwd())
    if os.path.exists(os.path.join(current, "data")): return current
    parent = os.path.dirname(current)
    if os.path.exists(os.path.join(parent, "data")): return parent
    return current

@router.post("/upload", response_model=FileUploadResponse)
async def upload_files(bank_file: UploadFile = File(...), ledger_file: UploadFile = File(...), db: Session = Depends(get_db)):
    if not bank_file.filename.endswith('.csv') or not ledger_file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are allowed")
    bank_df = processor.parse_csv(bank_file)
    ledger_df = processor.parse_csv(ledger_file)
    run = ReconciliationRun(status="PENDING", total_bank_records=len(bank_df), total_ledger_records=len(ledger_df))
    db.add(run); db.commit(); db.refresh(run)
    def save_txs(df, source, run_id):
        for _, row in df.iterrows():
            tx = Transaction(run_id=run_id, source=source, original_date=str(row.get('date', row.get('Date', ''))), original_description=str(row.get('desc', row.get('Description', ''))), amount=float(row.get('amount', row.get('Amount', 0))), raw_data=row.to_dict())
            db.add(tx)
    save_txs(bank_df, "BANK", run.id); save_txs(ledger_df, "LEDGER", run.id)
    db.commit()
    return FileUploadResponse(run_id=run.id, bank_columns=bank_df.columns.tolist(), ledger_columns=ledger_df.columns.tolist(), bank_record_count=len(bank_df), ledger_record_count=len(ledger_df))

@router.post("/reconcile/{run_id}")
async def start_reconciliation(run_id: int, db: Session = Depends(get_db)):
    run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
    if not run: raise HTTPException(status_code=404, detail="Run not found")
    run.status = "PROCESSING"; db.commit()
    start_time = time.time()
    bank_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == "BANK").all()
    ledger_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == "LEDGER").all()
    bank_df = pd.DataFrame([tx.__dict__ for tx in bank_txs]); ledger_df = pd.DataFrame([tx.__dict__ for tx in ledger_txs])
    mapping = {'bank': {'date': 'original_date', 'amount': 'amount', 'description': 'original_description'}, 'ledger': {'date': 'original_date', 'amount': 'amount', 'description': 'original_description'}}
    results = await orchestrator.run_reconciliation(bank_df, ledger_df, mapping)
    for res in results:
        btx_id = bank_txs[res['bank_index']].id
        ltx_id = ledger_txs[res['ledger_index']].id if res.get('ledger_index') is not None else None
        match = Match(run_id=run_id, bank_transaction_id=btx_id, ledger_transaction_id=ltx_id, status=res['status'], confidence=res['confidence'], matching_signals=res.get('signals', {}), explanation=res['explanation'])
        db.add(match)
        if res['status'] == 'UNRESOLVED' and ltx_id is None:
             exc = ExceptionRecord(run_id=run_id, transaction_id=btx_id, type="MISSING_LEDGER", description="No matching ledger entry found", severity="MEDIUM", status="OPEN")
             db.add(exc)
    run.status = "COMPLETED"; run.processing_time = time.time() - start_time
    run.matched_records = len([r for r in results if r['status'] == 'MATCHED'])
    db.commit()
    return {"status": "success", "matches_found": len(results)}

@router.get("/runs/{run_id}/metrics", response_model=DashboardMetrics)
async def get_metrics(run_id: int, db: Session = Depends(get_db)):
    metrics = dashboard_service.get_summary_metrics(db, run_id)
    if not metrics: raise HTTPException(status_code=404, detail="Run not found")
    return metrics

@router.get("/runs/{run_id}/matches", response_model=List[MatchSchema])
async def get_matches(run_id: int, db: Session = Depends(get_db)):
    matches = db.query(Match).filter(Match.run_id == run_id).all()
    reviewed_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id == run_id).all()}
    result = []
    for m in matches:
        bank_tx = db.query(Transaction).filter(Transaction.id == m.bank_transaction_id).first()
        ledger_tx = db.query(Transaction).filter(Transaction.id == m.ledger_transaction_id).first() if m.ledger_transaction_id else None
        result.append({
            "id": m.id, "bank_transaction_id": m.bank_transaction_id, "ledger_transaction_id": m.ledger_transaction_id,
            "status": m.status, "confidence": m.confidence, "explanation": m.explanation,
            "matching_signals": m.matching_signals or {}, "bank_detail": bank_tx.raw_data if bank_tx else {},
            "ledger_detail": ledger_tx.raw_data if ledger_tx else None,
            "is_reviewed": m.id in reviewed_ids
        })
    return result

@router.post("/matches/{match_id}/review")
async def review_match(match_id: int, action: ReviewAction, db: Session = Depends(get_db)):
    match = db.query(Match).filter(Match.id == match_id).first()
    if not match: raise HTTPException(status_code=404, detail="Match not found")
    run = db.query(ReconciliationRun).filter(ReconciliationRun.id == match.run_id).first()
    prev_status = match.status
    if action.action == "ACCEPT":
        if match.ledger_transaction_id:
            existing_match = db.query(Match).filter(Match.run_id == match.run_id, Match.ledger_transaction_id == match.ledger_transaction_id, Match.status == "MATCHED", Match.id != match.id).first()
            if existing_match: raise HTTPException(status_code=400, detail="Ledger transaction is already matched.")
        match.status = "MATCHED"; match.confidence = 1.0
        if prev_status != "MATCHED": run.matched_records += 1
    elif action.action == "REJECT":
        if prev_status == "MATCHED": run.matched_records -= 1
        match.status = "UNRESOLVED"; match.ledger_transaction_id = None
    elif action.action == "MARK_EXCEPTION":
        if prev_status == "MATCHED": run.matched_records -= 1
        match.status = "EXCEPTION"
        exc = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == match.run_id, ExceptionRecord.transaction_id == match.bank_transaction_id).first()
        if not exc:
            exc = ExceptionRecord(run_id=match.run_id, transaction_id=match.bank_transaction_id, type="USER_DEFINED", description=action.comment or "Marked by user", severity="HIGH", status="OPEN")
            db.add(exc)
    db.add(ReviewDecision(match_id=match_id, user_action=action.action, previous_status=prev_status, final_status=match.status, comment=action.comment))
    db.commit()
    return {"status": "success", "new_status": match.status}

@router.get("/runs/{run_id}/report")
async def get_report(run_id: int, db: Session = Depends(get_db)):
    report = report_generator.generate_summary(db, run_id)
    if not report: raise HTTPException(status_code=404, detail="Run not found")
    return report

@router.get("/runs/{run_id}/intelligence", response_model=RunIntelligence)
async def get_intelligence(run_id: int, db: Session = Depends(get_db)):
    intel = intelligence_service.get_run_intelligence(db, run_id)
    if not intel: raise HTTPException(status_code=404, detail="Run not found")
    return intel

@router.get("/benchmarks")
async def list_benchmarks():
    return [{"id": "easy", "name": "Standard (Easy)", "difficulty": "EASY"}, {"id": "medium", "name": "Fuzzy Mixed", "difficulty": "MEDIUM"}, {"id": "hard", "name": "Adversarial", "difficulty": "HARD"}]

@router.post("/benchmarks/{benchmark_id}/run")
async def run_benchmark(benchmark_id: str):
    try:
        root = get_project_root()
        bank = os.path.join(root, "data", "synthetic", f"bank_{benchmark_id}.csv")
        ledger = os.path.join(root, "data", "synthetic", f"ledger_{benchmark_id}.csv")
        gt = os.path.join(root, "data", "ground_truth", f"gt_{benchmark_id}.csv")
        if not os.path.exists(bank): raise HTTPException(status_code=404, detail=f"Benchmark data not found at {bank}")
        result = await benchmark_runner.run_benchmark(bank, ledger, gt, benchmark_id)
        return result
    except Exception as e:
        logger.exception(f"Benchmark {benchmark_id} failed")
        raise HTTPException(status_code=500, detail=f"Engine failure: {str(e)}")

@router.post("/copilot/query")
async def copilot_query(request: Dict[str, Any], db: Session = Depends(get_db), _ = Depends(rate_limiter.check_rate_limit)):
    run_id = request.get("context", {}).get("runId")
    if not run_id: raise HTTPException(status_code=400, detail="Missing runId")
    query = request.get("query", ""); result = await copilot.answer_query(query, int(run_id), db)
    return result
