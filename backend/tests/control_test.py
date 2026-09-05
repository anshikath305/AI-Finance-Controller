import asyncio
import sys
import os
from sqlalchemy.orm import Session

# Add project root to path
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from app.core.database import SessionLocal, init_db
from app.models.database import ReconciliationRun, Match, Transaction, ReviewDecision, ExceptionRecord, AuditLog
from app.services.reporting.control_monitor import ControlHealthService

async def test_control_health_proactive():
    print("--- Testing Proactive Control Health Logic ---")
    init_db()
    db = SessionLocal()
    
    # 0. Precise Cleanup
    db.query(ReviewDecision).delete()
    db.query(AuditLog).delete()
    db.query(ExceptionRecord).delete()
    db.query(Match).delete()
    db.query(Transaction).delete()
    db.query(ReconciliationRun).delete()
    db.commit()
    
    # 1. Create baseline run
    import datetime
    baseline = ReconciliationRun(status="COMPLETED", total_bank_records=10, matched_records=10, created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1))
    db.add(baseline); db.commit(); db.refresh(baseline)
    
    # Baseline transactions for financial metrics
    btx_base = Transaction(run_id=baseline.id, source="BANK", original_date="2026-08-30", amount=1000.0)
    db.add(btx_base); db.commit()
    m_base = Match(run_id=baseline.id, bank_transaction_id=btx_base.id, status='MATCHED', confidence=1.0)
    db.add(m_base); db.commit()

    # 2. Create current run with regression (Match rate drop)
    current = ReconciliationRun(status="COMPLETED", total_bank_records=10, matched_records=5, created_at=datetime.datetime.utcnow())
    db.add(current); db.commit(); db.refresh(current)
    
    # 3. Get controls
    ctx = ControlHealthService.get_run_controls(db, current.id)
    
    # 4. Assertions
    print(f"Overall Health: {ctx['overall_health']}")
    assert ctx['overall_health'] == "CRITICAL" # 100% -> 50% match rate is a >10pp drop
    
    # Alert check
    alert_types = [a['alert_type'] for a in ctx['alerts']]
    print(f"Detected Alerts: {alert_types}")
    assert "MATCH_RATE_DROP" in alert_types
    
    mr_alert = next(a for a in ctx['alerts'] if a['alert_type'] == "MATCH_RATE_DROP")
    print(f"Alert Severity: {mr_alert['severity']}")
    assert mr_alert['severity'] == "CRITICAL"
    assert mr_alert['baseline_run_id'] == baseline.id
    
    print("PASS: Proactive risk detection verified.")
    db.close()

if __name__ == "__main__":
    asyncio.run(test_control_health_proactive())
