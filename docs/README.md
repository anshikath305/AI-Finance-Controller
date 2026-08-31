# AI Finance-Ops Agent

An AI-powered financial reconciliation agent that reconciles bank transactions against an internal ledger, explains matching decisions, identifies discrepancies, and routes uncertain cases to human review.

## Core Principle

> Automate the obvious. Explain the uncertain. Never fabricate certainty.

## What It Does

```
Bank CSV
     +
Ledger CSV
     ↓
Validation
     ↓
Normalization
     ↓
Deterministic Matching
     ↓
AI-Assisted Matching
     ↓
Human Review
     ↓
Reconciliation Report
```

## Key Features

- CSV upload
- Schema detection
- Data normalization
- One-to-one reconciliation
- Deterministic matching
- AI-assisted semantic matching
- Confidence scoring
- Human review queue
- Exception detection
- Ground-truth evaluation
- Reconciliation dashboard
- Reconciliation Copilot
- Exportable reports

## AI Philosophy

AI is used for interpretation and reasoning.

Financial calculations, source data, reconciliation state, and evaluation metrics remain deterministic.

## Documentation

- `PRD.md` — Product requirements
- `AI-Design.md` — AI architecture and boundaries
- `Architecture.md` — Technical architecture
- `Rules.md` — Engineering and AI rules
- `Phases.md` — Development roadmap
- `Design.md` — UI/UX system
- `Memory.md` — Development continuity

## MVP Scope

The MVP focuses exclusively on:

```
Bank ↔ Internal Ledger
```

using:

```
CSV + one-to-one matching
```

Live bank integrations, payment execution, tax workflows, and autonomous financial decisions are outside the MVP.

## Evaluation

The system is evaluated against synthetic datasets with known ground truth.

Metrics include:

- Precision
- Recall
- F1
- False-match rate
- Exception detection rate
- Human review rate
- Processing time

## The Documentation Relationship

This is the part worth keeping in mind while building:

```
                     ┌─────────────┐
                     │    PRD      │
                     │ WHAT/WHY    │
                     └──────┬──────┘
                            │
          ┌─────────────────┴─────────────────┐
          │                                   │
          ▼                                   ▼
  ┌───────────────┐                    ┌───────────────┐
  │ AI-Design.md  │                    │ Architecture  │
  │ HOW AI THINKS │                    │ HOW SYSTEM    │
  │ & BOUNDARIES  │                    │ IS BUILT      │
  └───────┬───────┘                    └───────┬───────┘
          │                                    │
          └────────────────┬───────────────────┘
                           ▼
                   ┌──────────────┐
                   │   Rules.md   │
                   │ CONSTRAINTS  │
                   └───────┬──────┘
                           │
                           ▼
                   ┌──────────────┐
                   │  Phases.md   │
                   │ BUILD ORDER  │
                   └───────┬──────┘
                           │
                           ▼
                   ┌──────────────┐
                   │  Design.md   │
                   │ HOW IT LOOKS │
                   └───────┬──────┘
                           │
                           ▼
                   ┌──────────────┐
                   │  Memory.md   │
                   │ WHAT CHANGED │
                   └──────────────┘
```

And the most important architectural idea underneath all of them:

```
                USER
                  │
                  ▼
            ┌───────────┐
            │   DATA    │
            └─────┬─────┘
                  ▼
          ┌───────────────┐
          │ DETERMINISTIC │
          │    ENGINE     │
          └───────┬───────┘
                  ▼
            ┌───────────┐
            │    AI     │
            │ REASONING │
            └─────┬─────┘
                  ▼
           ┌────────────┐
           │   HUMAN    │
           │   REVIEW   │
           └─────┬──────┘
                 ▼
             REPORT
```

That separation is the backbone of the entire project.

The AI isn't being used because "AI sounds cool." It has a very specific job: deal with ambiguity that deterministic matching cannot comfortably handle. And the Copilot sits above the system as a convenient conversational interface — not as the thing making the financial truth.

That gives a clean foundation to move into actual implementation without the project turning into an over-engineered "AI accountant" halfway through.
