# BrandGuard AI — Security, Privacy & Responsible AI Architecture

## 1. Security Architecture

### Role-Based Access Control (RBAC) & Segregation of Duties
BrandGuard AI enforces backend authorization checks at the API controller layer:
- **`CREATOR`**: Can create drafts, upload documents, view findings, apply AI corrections, and participate in discussion threads. **Strictly prohibited from approving their own reviews**.
- **`REVIEWER`**: Can inspect findings, add feedback comments, request revisions, and formally approve eligible reviews.
- **`BRAND_MANAGER`**: Can create, edit, version, and activate/deactivate guidelines, approved facts, and brand assets.
- **`ADMIN`**: Manages workspace configuration, role assignments, and team memberships.

### Safe Input Validation & File Handling
- File uploads are validated via Multer against a strict whitelist:
  - Documents: `.txt`, `.md`, `.pdf`, `.docx`, `.doc`
  - Images: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`
- Hard limit of 15MB per file to defend against Denial-of-Service (DoS) attacks.
- Files are assigned cryptographically random names before disk storage.
- Files are never executed or evaluated in shell contexts.

### Safe Error Messages & Secrets Management
- Database connection strings, JWT signing keys, and external API credentials are read exclusively from environment variables (`.env`).
- Express central error handlers sanitize server exceptions and never expose stack traces, database schema details, or environment variables to client responses.

---

## 2. Privacy & Data Sovereignty

### Local Data Persistence
- When run in standard local evaluation mode, all draft copy, comments, guideline versions, and audit logs remain strictly within the local SQLite database (`dev.db`).
- Zero data is transmitted to third-party telemetry, advertising, or external analytics endpoints.

### Confidentiality Scanning
BrandGuard AI includes a built-in Confidentiality category that actively scans content for:
- Accidental disclosure of live API secret keys (e.g., `sk_live_*`).
- Internal staging domain leaks (e.g., `*.staging.internal.novatech.io`).
- Confidential unannounced codenames (e.g., "Project Hyperion", "Project Titan").
- Redaction utilities allow creators to scrub sensitive strings prior to reviewer sign-off.

---

## 3. Responsible AI & Transparency Disclosure

### Deterministic Demo vs. LLM Analysis
- In default configuration (`AI_PROVIDER=demo`), the platform executes transparent, deterministic rule-based compliance checks.
- Findings generated in demo mode are explicitly labeled:
  > *"Analyzed via BrandGuard Deterministic Rule Engine. All findings are directly linked to active brand guidelines and verified approved sources. No fabricated claims."*
- When an external LLM is configured (`AI_PROVIDER=openai`), output is constrained by a JSON schema and citations are validated against actual registered sources.

### Human-in-the-Loop Authority
- AI findings and scores are decision-support indicators, **never autonomous publishing triggers**.
- Even a compliance score of 95% cannot bypass human review if critical unresolved findings exist.
- Final publication approval requires explicit human sign-off recorded in the audit trail.
