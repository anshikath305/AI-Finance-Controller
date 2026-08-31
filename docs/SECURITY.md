# Security & Data Privacy — AI Finance-Ops Agent

## 1. Threat Model Summary
| Risk | Severity | Mitigation | Status |
| :--- | :--- | :--- | :--- |
| **CSV Formula Injection** | HIGH | Sanitization of exported strings starting with dangerous characters (`=`, `+`, etc.). | IMPLEMENTED |
| **Prompt Injection** | HIGH | Clear data/instruction delimiting using `[[data]]` and specific AI grounding rules. | IMPLEMENTED |
| **Resource Exhaustion** | MEDIUM | File size (5MB) and row count (10k) limits on CSV ingestion. | IMPLEMENTED |
| **Secret Leakage** | MEDIUM | Redaction filters in logs and environment-only key loading. | IMPLEMENTED |
| **Cross-Run Data Leakage**| MEDIUM | Context-locked queries in Copilot and Dashboard. | IMPLEMENTED |

## 2. Sensitive Data Flow
- **Ingestion**: Raw CSVs are parsed and stored in the database.
- **LLM**: Only the minimum relevant transaction fields (Amount, Date, Description) are sent to the AI provider. No full datasets or PII (e.g., account numbers) should reach the LLM.
- **Export**: Reports are generated from persisted data and sanitized to prevent spreadsheet vulnerabilities.

## 3. Secret Management
- `OPENAI_API_KEY`: Must be set via environment variable. Never committed to VCS.
- `DATABASE_URL`: Defaults to local SQLite for MVP; should use managed SQL for production.

## 4. Operational Limits
- **AI Rate Limiting**: 10 requests per minute per client IP.
- **Upload Limits**: 5MB max file size, 10,000 max rows per CSV.

## 5. Security Checklist for Production
- [ ] Implement proper Authentication (SSO/OIDC).
- [ ] Enable HTTPS/TLS for all traffic.
- [ ] Implement Data Deletion / Retention policy.
- [ ] Switch to a dedicated database (PostgreSQL) with encrypted storage.
- [ ] Perform a third-party penetration test on the LLM prompt boundaries.

## 6. Known Limitations
- No multi-user role-based access control (RBAC) yet.
- Rate limiting is in-memory and will reset on server restart.
