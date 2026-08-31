# Demo Script — AI Finance-Ops Controller

Follow these steps to demonstrate the full capabilities of the platform.

## Preparation
1. Ensure the backend is running (`uvicorn app.main:app`).
2. Ensure the frontend is running (`npm run dev`).
3. Have the synthetic CSVs ready (`data/synthetic/`).

## Step 1: Guided Ingestion
- Open the application.
- Click **Start Reconciliation**.
- Upload `bank_medium.csv` and `ledger_medium.csv`.
- Point out the validation status and file metadata.
- Click **Start Reconciliation**.

## Step 2: Dashboard Overview
- View the **Match Rate** and **Reconciled Volume**.
- Highlight the **Automation Impact** card (showing Deterministic vs AI matches).
- Explain that all numbers are aggregated directly from the database facts.

## Step 3: Human Verification
- Click **Review Ambiguous Cases**.
- Show the side-by-side comparison.
- Point out the **Deterministic Evidence** (Facts) vs **AI Interpretive Reasoning** (Interpretation).
- Click **Confirm Match** and watch the counter progress.

## Step 4: Analytical Investigation
- Open the **Copilot** (bottom right).
- Click the **Summary** suggestion chip.
- Ask: "Why is B_medium_0012 unresolved?"
- Show how the Copilot retrieves the evidence log for that specific transaction.
- Ask: "What are the largest exceptions?" to show structured cards.

## Step 5: Scientific Evaluation
- Navigate to **Quality Assurance Labs** (benchmarking).
- Click **Execute Benchmark** for the "Standard" or "Fuzzy" set.
- Show the **100.0% Precision** score as evidence of system safety.

## Step 6: Audit Export
- Go back to the Dashboard.
- Click **Export JSON**.
- Open the file to show the structured provenance (deterministic vs AI vs human) of every record.
