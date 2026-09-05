# System Architecture — AI Finance-Ops Controller

## 1. High-Level Design
The system follows a modular monolith architecture with a clear separation between the reactive frontend and the analytical backend.

```
[ Frontend: Next.js ] <---> [ API: FastAPI ] <---> [ DB: SQLite/SQLAlchemy ]
                                 |
                                 v
                       [ Matching Engine Layer ]
                                 |
                       [ AI Service / OpenAI ]
```

## 2. Core Components

### A. Reconciliation Engine
- **Normalizer**: Cleans and prepares data, handling multi-currency and Indian number formatting.
- **Matching Engine**: Executes high-performance multi-pass greedy assignment. Uses sorted amount-based indexing and binary search (O(N log N)) for candidate generation.
- **Orchestrator**: Manages the flow between deterministic rules, AI semantic enrichment, and policy enforcement (STRICT, STANDARD, CUSTOM).

### B. AI & Reasoning
- **AI Service**: Validated GPT-4o integration with Pydantic schemas.
- **Copilot Query Layer**: Grounded fact-retrieval system that translates database state into LLM context.

### C. Reporting, Intelligence & Evidence
- **Dashboard Service**: Real-time SQL aggregations for operational metrics and run history summaries.
- **Comparison Service**: Computes deltas and trends between two reconciliation runs.
- **Intelligence Service**: Identifies recurring patterns in exceptions for workload analysis.
- **Operations Service**: Aggregates multi-run context into a unified command center.
- **Control Health Service**: Detects operational risks and run-over-run regressions.
- **Audit Service**: Constructs chronological decision timelines and transaction traces.
- **Actionability Service**: Generates prioritized operational recommendations based on exception intelligence.
- **Review Learning Service**: Analyzes historical human decisions to identify override patterns and calibrate confidence.
- **Evidence Service**: Generates structured, multi-level explanations for every match decision.
- **Evaluator**: Independent logic for comparing predictions against isolated ground-truth labels.

### D. Onboarding & Ingestion
- **Processor**: Parses raw CSV and Excel artifacts with encoding detection (chardet) and security sanitization.
- **Column Detector**: Deterministically identifies Amount, Date, Description, and ID roles using alias-based normalization.
- **Readiness Checker**: Performs structural health checks (Monetary/Temporal integrity, uniqueness) before reconciliation.

### E. Identity & Governance
- **Authentication**: JWT-based secure session management with query-token support for report downloads.
- **Authorization**: Granular RBAC (Role-Based Access Control) enforced at the service and API layers.

### F. Infrastructure & Observability
- **Configuration**: Pydantic-based environment management.
- **Observability**: Structured JSON logging, correlation IDs, and process-time tracking headers.
- **Health Monitoring**: Liveness (/health) and Readiness (/ready) probes for deployment orchestration.

## 3. Data Flow (Match Lifecycle)
1. **Source**: Uploaded CSV.
2. **Identity**: Transaction saved to `transactions` table.
3. **Draft**: Matching engine creates potential `Match` records.
4. **Enrichment**: AI adds `signals` and `explanation`.
5. **Decision**: User accepts/rejects, triggering `ReviewDecision` and updating the audit log.
6. **Final**: Record appears in `Report` export.

## 4. Technology Stack
- **Web**: Next.js 14, Tailwind CSS, Lucide React.
- **Logic**: Python 3.13, FastAPI, Pandas.
- **Persistence**: SQLAlchemy ORM, SQLite.
- **LLM**: OpenAI GPT-4o API.
