# AI Design & Reasoning Strategy — AI Finance-Ops Controller

## 1. Intentional AI Usage
AI is used as an interpretative layer, not as a decision-maker for financial truth.

### A. Semantic Merchant Matching
- **Problem**: "AMZN MKTP" vs "Amazon Marketplace".
- **AI Role**: Explain the abbreviation relationship and confirm semantic identity.
- **Output**: JSON structure with confidence and evidence tags.

### B. Analytical Copilot
- **Problem**: Investigating why a complex run has unresolved records.
- **AI Role**: Translate structured database facts into human-friendly explanations.
- **Grounding**: Facts are retrieved via `CopilotQueryLayer` before being passed to the LLM.

## 2. Safety Boundaries (The Shield)
- **Delimited Prompts**: Untrusted transaction data is wrapped in clear tags to prevent indirect prompt injection.
- **Schema Enforcement**: All AI responses are validated against Pydantic models. Malformed output is rejected and the system falls back to human review.
- **Zero Fabrication**: If the query layer returns no facts, the AI is instructed to say "I don't know" rather than estimating numbers.

## 3. Fallback Heuristics
If the LLM is unavailable:
- **Heuristic Resolver**: Uses Jaccard word-overlap and keyword mappings.
- **Template Explainer**: Provides standard deterministic explanations for matches.
- **Trust preservation**: User is notified that AI analysis is currently inactive.

## 4. Performance & Cost
- **Blocking**: Deterministic engine filters out 60-90% of cases before AI is ever called.
- **Rate Limiting**: 10 requests per minute per IP to prevent runaway API costs.
