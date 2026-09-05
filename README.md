# AI Finance-Ops Controller

A trustworthy AI-powered financial reconciliation platform that reconciles Bank CSV statements against Internal Ledger CSV records using a hybrid deterministic + semantic matching engine.

## Core Principle
> **Automate the obvious. Explain the uncertain. Never fabricate certainty.**

The product is designed for finance-ops and accounting professionals who require 100% financial precision while seeking to reduce manual reconciliation workload.

## Key Features

- **Hybrid Matching Engine**: Combines deterministic rules (Exact Amount, Date, ID) with AI semantic reasoning (Merchant abbreviation resolution, Description interpretation).
- **Human-in-the-Loop**: A dedicated verification queue for ambiguous cases, ensuring a human professional remains the final authority for uncertain transactions.
- **Audit-Ready Analytics**: Real-time dashboard with operational, financial, and automation impact metrics.
- **Analytical Copilot**: A grounded conversational assistant that investigates discrepancies and explains decisions using real backend data.
- **Enterprise Governance**: Multi-tenant isolation, RBAC (ADMIN, REVIEWER, etc.), and user-attributed audit trails.
- **Scientific Evaluation**: Integrated benchmarking suite to measure Precision, Recall, and F1 scores against ground-truth datasets.
- **Hardened Security**: Protection against prompt injection, CSV formula injection, and resource exhaustion.

## Tech Stack

- **Frontend**: Next.js, React, TypeScript, Tailwind CSS, Lucide Icons.
- **Backend**: Python, FastAPI, SQLAlchemy, Pandas.
- **Database**: SQLite (MVP) / PostgreSQL compatible.
- **AI**: OpenAI GPT-4o integration with deterministic heuristic fallbacks.

## Reconciliation Pipeline

1.  **Ingestion**: CSV upload with structural validation and column mapping.
2.  **Normalization**: Generic text/date/amount normalization preserving original values.
3.  **Deterministic Pass**: High-confidence matching of exact identifiers and amounts.
4.  **Semantic Pass**: AI-assisted evaluation of ambiguous merchant descriptions.
5.  **Human Review**: Routing of uncertain candidates to the verification queue.
6.  **Persistence**: Immutable audit trail of system recommendations and human decisions.

## Evaluation Baseline
Results validated on synthetic benchmark datasets:

| Dataset | Precision | Recall | Status |
| :--- | :--- | :--- | :--- |
| **Easy** | 100.0% | 100.0% | Baseline Verified |
| **Medium** | 100.0% | 70.5% | Heuristic Active |
| **Hard** | 100.0% | 31.1% | Adversarial Safe |

*Note: The engine is tuned to prioritize **100% Precision** over Recall.*

## Setup & Running

### Backend
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create a `.env` in the `backend/` directory:
```env
DATABASE_URL=sqlite:///./finance_agent.db
OPENAI_API_KEY=your_key_here
```

## Security
For a detailed threat model and safety overview, see [docs/SECURITY.md](docs/SECURITY.md).

## Limitations & Future Work
- **One-to-One Matching**: Currently limited to single-transaction reconciliation.
- **Data Sources**: Specialized for CSV/Excel input; bank API integrations are planned for future versions.

---
**Build for Trust. Verified by Evidence.**
