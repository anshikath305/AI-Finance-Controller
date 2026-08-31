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
