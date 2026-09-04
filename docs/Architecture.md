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
- **Normalizer**: Cleans and prepares data without mutating source values.
- **Matching Engine**: Executes multi-pass greedy assignment.
- **Orchestrator**: Manages the flow between deterministic rules and AI semantic enrichment.

### B. AI & Reasoning
- **AI Service**: Validated GPT-4o integration with Pydantic schemas.
- **Copilot Query Layer**: Grounded fact-retrieval system that translates database state into LLM context.

### C. Reporting, Intelligence & Evidence
- **Dashboard Service**: Real-time SQL aggregations for operational metrics.
- **Intelligence Service**: Identifies recurring patterns in exceptions for workload analysis.
- **Evidence Service**: Generates structured, multi-level explanations for every match decision.
- **Evaluator**: Independent logic for comparing predictions against isolated ground-truth labels.

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
