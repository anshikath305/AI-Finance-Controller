import pandas as pd
import io
from sqlalchemy.orm import Session
from app.models.database import ReconciliationRun, Match, Transaction, ExceptionRecord, ReviewDecision
from app.services.reconciliation.evidence import EvidenceService
from app.services.reporting.intelligence import ExceptionIntelligenceService
from typing import Dict, Any, List
from fpdf import FPDF
import datetime

class ReportGenerator:
    @staticmethod
    def sanitize_for_xlsx(value: Any) -> Any:
        """
        Prevent CSV/XLSX Formula Injection by prefixing values starting with dangerous characters.
        """
        if isinstance(value, str) and value and value[0] in ['=', '+', '-', '@']:
            return "'" + value
        return value

    @staticmethod
    def generate_summary(db: Session, run_id: int) -> Dict[str, Any]:
        run = db.query(ReconciliationRun).filter(ReconciliationRun.id == run_id).first()
        if not run: return {}

        matches = db.query(Match).filter(Match.run_id == run_id).all()
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()

        bank_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == 'BANK').all()
        ledger_txs = db.query(Transaction).filter(Transaction.run_id == run_id, Transaction.source == 'LEDGER').all()

        bank_total = sum([tx.amount for tx in bank_txs])
        ledger_total = sum([tx.amount for tx in ledger_txs])

        reconciled_amt = sum([btx.amount for btx, m in db.query(Transaction, Match).filter(
            Transaction.id == Match.bank_transaction_id,
            Match.run_id == run_id,
            Match.status == 'MATCHED'
        ).all()])

        # Provenance
        reviewed_ids = {d.match_id for d in db.query(ReviewDecision.match_id).join(Match).filter(Match.run_id == run_id).all()}
        
        auto_matches = [m for m in matches if m.status == 'MATCHED' and m.id not in reviewed_ids and not (m.matching_signals or {}).get('ai_evidence')]
        ai_matches = [m for m in matches if m.status == 'MATCHED' and m.id not in reviewed_ids and (m.matching_signals or {}).get('ai_evidence')]
        human_matches = [m for m in matches if m.status == 'MATCHED' and m.id in reviewed_ids]

        intel = ExceptionIntelligenceService.get_run_intelligence(db, run_id)

        return {
            "metadata": {
                "run_id": run_id,
                "status": run.status,
                "created_at": run.created_at.isoformat() if run.created_at else None,
                "processing_time": round(run.processing_time, 2) if run.processing_time else 0,
                "policy_config": run.policy_config
            },
            "counts": {
                "total_bank": run.total_bank_records,
                "total_ledger": run.total_ledger_records,
                "matched": run.matched_records,
                "unresolved": len([m for m in matches if m.status == 'UNRESOLVED']),
                "possible_matches": len([m for m in matches if m.status == 'POSSIBLE_MATCH']),
                "exceptions": len(exceptions)
            },
            "financials": {
                "bank_total": round(float(bank_total), 2),
                "ledger_total": round(float(ledger_total), 2),
                "reconciled_amount": round(float(reconciled_amt), 2),
                "unreconciled_amount": round(float(bank_total - reconciled_amt), 2)
            },
            "provenance": {
                "deterministic": len(auto_matches),
                "ai_assisted": len(ai_matches),
                "human_reviewed": len(human_matches)
            },
            "intelligence": intel
        }

    @staticmethod
    def generate_xlsx(db: Session, run_id: int) -> io.BytesIO:
        summary = ReportGenerator.generate_summary(db, run_id)
        matches = db.query(Match).filter(Match.run_id == run_id).all()
        
        # 1. Summary Sheet
        summary_data = [
            ["Metric", "Value"],
            ["Run ID", summary["metadata"]["run_id"]],
            ["Created At", summary["metadata"]["created_at"]],
            ["Total Bank Records", summary["counts"]["total_bank"]],
            ["Total Ledger Records", summary["counts"]["total_ledger"]],
            ["Matched Records", summary["counts"]["matched"]],
            ["Total Bank Amount", summary["financials"]["bank_total"]],
            ["Reconciled Amount", summary["financials"]["reconciled_amount"]],
            ["Unreconciled Amount", summary["financials"]["unreconciled_amount"]],
            ["Automation: Deterministic", summary["provenance"]["deterministic"]],
            ["Automation: AI-Assisted", summary["provenance"]["ai_assisted"]],
            ["Automation: Human-Reviewed", summary["provenance"]["human_reviewed"]],
            ["Policy: Profile", summary["metadata"]["policy_config"].get("profile_name") if summary["metadata"]["policy_config"] else "STANDARD"],
            ["Policy: Date Tolerance", summary["metadata"]["policy_config"].get("date_tolerance") if summary["metadata"]["policy_config"] else 3],
            ["Policy: Amount Tolerance", summary["metadata"]["policy_config"].get("amount_tolerance") if summary["metadata"]["policy_config"] else 0.01],
            ["Policy: Currency", summary["metadata"]["policy_config"].get("currency") if summary["metadata"]["policy_config"] else "INR"]
        ]
        df_summary = pd.DataFrame(summary_data[1:], columns=summary_data[0])

        # 2. Detailed Reconciliation Sheet
        reconciliation_list = []
        for m in matches:
            btx = db.query(Transaction).filter(Transaction.id == m.bank_transaction_id).first()
            ltx = db.query(Transaction).filter(Transaction.id == m.ledger_transaction_id).first() if m.ledger_transaction_id else None
            evidence = EvidenceService.get_match_evidence(db, m.id)
            
            reconciliation_list.append({
                "Status": m.status,
                "Confidence": f"{round(m.confidence * 100, 0)}%",
                "Method": evidence.get("decision", {}).get("method", "Unknown"),
                "Bank Date": btx.original_date,
                "Bank Description": ReportGenerator.sanitize_for_xlsx(btx.original_description),
                "Bank Amount": btx.amount,
                "Ledger Date": ltx.original_date if ltx else "-",
                "Ledger Description": ReportGenerator.sanitize_for_xlsx(ltx.original_description) if ltx else "-",
                "Ledger Amount": ltx.amount if ltx else 0,
                "Explanation": evidence.get("decision", {}).get("explanation", m.explanation),
                "AI Reasoning": ReportGenerator.sanitize_for_xlsx(evidence.get("ai_interpretation", {}).get("reasoning", ""))
            })
        df_reco = pd.DataFrame(reconciliation_list)

        # 3. Exceptions Sheet
        exceptions = db.query(ExceptionRecord).filter(ExceptionRecord.run_id == run_id).all()
        exc_list = []
        for e in exceptions:
            tx = db.query(Transaction).filter(Transaction.id == e.transaction_id).first()
            exc_list.append({
                "Type": e.type,
                "Severity": e.severity,
                "Description": ReportGenerator.sanitize_for_xlsx(e.description),
                "Transaction Date": tx.original_date if tx else "-",
                "Transaction Desc": ReportGenerator.sanitize_for_xlsx(tx.original_description) if tx else "-",
                "Amount": tx.amount if tx else 0,
                "Status": e.status
            })
        df_exc = pd.DataFrame(exc_list)

        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='openpyxl') as writer:
            df_summary.to_excel(writer, sheet_name='Summary', index=False)
            df_reco.to_excel(writer, sheet_name='Detailed Reconciliation', index=False)
            if not df_exc.empty:
                df_exc.to_excel(writer, sheet_name='Exceptions', index=False)
            
            # Format columns
            for sheet in writer.sheets.values():
                for col in sheet.columns:
                    max_length = 0
                    column = col[0].column_letter
                    for cell in col:
                        try:
                            if len(str(cell.value)) > max_length:
                                max_length = len(str(cell.value))
                        except: pass
                    adjusted_width = (max_length + 2)
                    sheet.column_dimensions[column].width = min(adjusted_width, 50)

        output.seek(0)
        return output

    @staticmethod
    def generate_pdf(db: Session, run_id: int) -> io.BytesIO:
        summary = ReportGenerator.generate_summary(db, run_id)
        
        pdf = FPDF()
        pdf.add_page()
        pdf.set_font("helvetica", "B", 20)
        pdf.cell(0, 20, f"Reconciliation Executive Summary", ln=True, align='C')
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 10, f"Run ID: #{run_id} | Generated: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M')}", ln=True, align='C')
        pdf.ln(10)

        # Financials
        pdf.set_font("helvetica", "B", 14)
        pdf.set_fill_color(240, 240, 240)
        pdf.cell(0, 10, "Financial Overview", ln=True, fill=True)
        pdf.set_font("helvetica", "", 12)
        pdf.ln(2)
        pdf.cell(100, 10, "Total Bank Amount:")
        pdf.cell(0, 10, f"INR {summary['financials']['bank_total']:,.2f}", ln=True)
        pdf.cell(100, 10, "Reconciled Amount:")
        pdf.cell(0, 10, f"INR {summary['financials']['reconciled_amount']:,.2f}", ln=True)
        pdf.set_font("helvetica", "B", 12)
        pdf.cell(100, 10, "Net Discrepancy:")
        pdf.set_text_color(200, 0, 0)
        pdf.cell(0, 10, f"INR {summary['financials']['unreconciled_amount']:,.2f}", ln=True)
        pdf.set_text_color(0, 0, 0)
        pdf.ln(10)

        # Operational Counts
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, "Operational Metrics", ln=True, fill=True)
        pdf.set_font("helvetica", "", 12)
        pdf.ln(2)
        pdf.cell(100, 10, "Bank Transactions:")
        pdf.cell(0, 10, str(summary['counts']['total_bank']), ln=True)
        pdf.cell(100, 10, "Successfully Matched:")
        pdf.cell(0, 10, str(summary['counts']['matched']), ln=True)
        pdf.cell(100, 10, "Exceptions / Unresolved:")
        pdf.cell(0, 10, str(summary['counts']['unresolved'] + summary['counts']['exceptions']), ln=True)
        
        policy = summary['metadata']['policy_config'] or {}
        pdf.cell(100, 10, "Reconciliation Policy:")
        pdf.cell(0, 10, f"{policy.get('profile_name', 'STANDARD')} ({policy.get('date_tolerance', 3)}d tolerance)", ln=True)
        pdf.ln(10)

        # Automation Impact
        pdf.set_font("helvetica", "B", 14)
        pdf.cell(0, 10, "Automation Impact", ln=True, fill=True)
        pdf.set_font("helvetica", "", 12)
        pdf.ln(2)
        pdf.cell(100, 10, "Deterministic (Rule-based):")
        pdf.cell(0, 10, str(summary['provenance']['deterministic']), ln=True)
        pdf.cell(100, 10, "AI-Assisted:")
        pdf.cell(0, 10, str(summary['provenance']['ai_assisted']), ln=True)
        pdf.cell(100, 10, "Human-Reviewed:")
        pdf.cell(0, 10, str(summary['provenance']['human_reviewed']), ln=True)
        pdf.ln(10)

        # Intelligence Patterns
        if summary['intelligence']['patterns']:
            pdf.set_font("helvetica", "B", 14)
            pdf.cell(0, 10, "Top Exception Patterns", ln=True, fill=True)
            pdf.set_font("helvetica", "", 12)
            pdf.ln(2)
            for p in summary['intelligence']['patterns'][:3]:
                pdf.set_font("helvetica", "B", 11)
                pdf.cell(0, 8, f"{p['label']} ({p['case_count']} cases)", ln=True)
                pdf.set_font("helvetica", "", 10)
                pdf.multi_cell(0, 6, p['explanation'])
                pdf.ln(2)

        pdf.ln(20)
        pdf.set_font("helvetica", "I", 8)
        pdf.cell(0, 10, "This report was generated by AI Finance Controller. All data is grounded in authoritative source files.", ln=True, align='C')

        output = io.BytesIO()
        pdf.output(output)
        output.seek(0)
        return output
