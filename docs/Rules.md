# Business & Safety Rules — AI Finance-Ops Controller

## 1. Financial Integrity Rules
- **Amount Hard-Constraint**: No match can be automatically confirmed if the amount differs by more than 0.01. Amount mismatches MUST be routed to human review.
- **One-to-One Matching**: A single bank record may match exactly zero or one ledger record. Duplicate assignments are prohibited at the engine level.
- **Data Immutability**: Original uploaded financial values (amounts, dates, descriptions) must never be modified by the engine or AI.

## 2. Reconciliation Engine Rules
- **Pass 1 (Deterministic)**: Match if Amount, Date, and Normalized Merchant are identical.
- **Pass 2 (Fuzzy)**: Match if Amount is exact and Total Score >= 0.85.
- **Thresholds**:
  - `MATCH_THRESHOLD` = 0.85
  - `REVIEW_THRESHOLD` = 0.60
- **Priority**: Earlier dates and higher amounts are prioritized in greedy assignment.

## 3. AI Usage Rules
- **Read-Only Status**: AI has zero authority to write to the database or modify financial state.
- **Minimal Context**: AI only receives the current transaction pair being evaluated, never the full dataset.
- **Grounding**: Copilot responses must be traceable to the provided structured data facts.
- **Safety**: Prompt injection delimiters `[[data]]` must be used for all untrusted input.

## 4. Human Review Rules
- **Human Authority**: A human decision always overrides an engine or AI recommendation.
- **Audit Requirement**: Every human review action must store the original system recommendation for auditability.

## 5. Evidence Hierarchy Rules
- Level 1 (Raw Facts): Original source values from Bank and Ledger. Never modified.
- Level 2 (Deterministic Signals): Computed comparisons (Amount/Date/Merchant similarity).
- Level 3 (System Decision): The final status and why-not-matched reasoning.
- Level 4 (AI Interpretation): Interpretive reasoning for merchant semantic links. Must be visually distinct from facts.

## 6. Onboarding & Readiness Rules
- **No Blind Automation**: Never reconcile files that fail critical structural checks (Blocked state).
- **Deterministic Role Identification**: Use alias-based mapping for columns. Never use AI to guess financial roles without confirmation.
- **Preview Requirement**: Always show a data summary (stats/checks) before initiating the reconciliation engine.

## 7. Run History & Workspace Rules
- **Run Isolation**: A user session for Run ID X must never fetch or display data from Run ID Y.
- **Read-Only History**: Historical runs are for audit and navigation. No engine-level matching rules should be modified from the history view.
