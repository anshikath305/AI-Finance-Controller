from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, JSON
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import datetime

Base = declarative_base()

class ReconciliationRun(Base):
    __tablename__ = "reconciliation_runs"

    id = Column(Integer, primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String)  # PENDING, PROCESSING, COMPLETED, FAILED
    total_bank_records = Column(Integer, default=0)
    total_ledger_records = Column(Integer, default=0)
    matched_records = Column(Integer, default=0)
    processing_time = Column(Float, nullable=True)
    policy_config = Column(JSON, nullable=True) # Snapshot of policy at time of run

    transactions = relationship("Transaction", back_populates="run")
    matches = relationship("Match", back_populates="run")
    exceptions = relationship("ExceptionRecord", back_populates="run")

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"))
    source = Column(String)  # BANK, LEDGER
    source_transaction_id = Column(String, nullable=True)
    original_date = Column(String)
    normalized_date = Column(DateTime, nullable=True)
    original_description = Column(String)
    normalized_description = Column(String, nullable=True)
    amount = Column(Float)
    currency = Column(String, default="INR")
    raw_data = Column(JSON)

    run = relationship("ReconciliationRun", back_populates="transactions")

class Match(Base):
    __tablename__ = "matches"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"))
    bank_transaction_id = Column(Integer, ForeignKey("transactions.id"))
    ledger_transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=True)
    status = Column(String)  # MATCHED, POSSIBLE_MATCH, MISMATCH, UNRESOLVED, EXCEPTION
    confidence = Column(Float)
    matching_signals = Column(JSON)
    explanation = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    run = relationship("ReconciliationRun", back_populates="matches")

class ExceptionRecord(Base):
    __tablename__ = "exceptions"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"))
    transaction_id = Column(Integer, ForeignKey("transactions.id"))
    type = Column(String)  # AMOUNT_MISMATCH, DATE_MISMATCH, MISSING_RECORD, DUPLICATE
    description = Column(String)
    severity = Column(String)
    status = Column(String, default="OPEN")  # OPEN, INVESTIGATING, RESOLVED
    resolution_type = Column(String, nullable=True)
    resolution_reason = Column(String, nullable=True)
    notes = Column(String, nullable=True)
    resolved_by = Column(String, nullable=True)
    resolved_at = Column(DateTime, nullable=True)
    reopened_at = Column(DateTime, nullable=True)
    owner = Column(String, nullable=True)
    due_date = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    run = relationship("ReconciliationRun", back_populates="exceptions")

class ReviewDecision(Base):
    __tablename__ = "review_decisions"

    id = Column(Integer, primary_key=True, index=True)
    match_id = Column(Integer, ForeignKey("matches.id"))
    user_action = Column(String)  # ACCEPT, REJECT, MARK_EXCEPTION
    previous_status = Column(String)
    final_status = Column(String)
    comment = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    run_id = Column(Integer, ForeignKey("reconciliation_runs.id"), nullable=True)
    match_id = Column(Integer, ForeignKey("matches.id"), nullable=True)
    event_type = Column(String) # RUN_CREATED, FILE_INGESTED, RECONCILIATION_COMPLETED, etc.
    actor_type = Column(String) # SYSTEM, HUMAN, AI_ASSISTED
    description = Column(String)
    metadata_json = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
