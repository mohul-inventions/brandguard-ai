# BrandGuard AI — Architecture & Technical Design

## 1. System Overview

**BrandGuard AI** is an enterprise content governance and compliance platform engineered to ensure every piece of digital collateral complies with approved brand guidelines, voice standards, factual ground truth, and regulatory requirements before publication.

```
┌────────────────────────────────────────────────────────────────────────┐
│                          CLIENT APPLICATION                            │
│           (React 18, Vite, TypeScript, Tailwind CSS, Recharts)         │
│  - Overview Dashboard         - AI Correction Workspace               │
│  - Content Reviews Directory   - Brand Guidelines Manager (Versioning)  │
│  - Approvals Decision Queue   - Approved Sources & Ground Truth       │
│  - Governance Analytics       - Brand Asset Management Library         │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ REST API (JWT Authenticated)
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│                            BACKEND API                                 │
│                  (Node.js, Express, TypeScript, Multer)                │
│  - Auth & Role-Based RBAC     - Review & Revision Pipeline            │
│  - Multer / PDF / DOCX Parser - Segregation of Duties Engine           │
│  - Audit Logging Middleware   - Transparent Scoring Service           │
└──────────────────┬─────────────────────────────────┬───────────────────┘
                   │                                 │
                   ▼                                 ▼
┌─────────────────────────────────────┐ ┌────────────────────────────────┐
│       AI PROVIDER ADAPTER           │ │          PERSISTENCE           │
│  - DemoRuleEngineAdapter            │ │         (Prisma ORM)           │
│    (Deterministic rule engine)      │ │  - SQLite (Local `dev.db`)     │
│  - ExternalLLMAdapter               │ │  - Direct migration path to   │
│    (OpenAI / Gemini / Claude)       │ │    PostgreSQL via schema       │
└─────────────────────────────────────┘ └────────────────────────────────┘
```

---

## 2. Pluggable AI Provider Adapter

BrandGuard AI implements an adapter pattern (`AIProviderAdapter`) that separates business workflows from model providers.

```typescript
export interface AIProviderAdapter {
  name: 'DEMO_DETERMINISTIC' | 'OPENAI' | 'GEMINI' | 'ANTHROPIC';
  analyze(request: AIAnalysisRequest): Promise<AnalysisResponse>;
}
```

### Deterministic Demo Rule Engine (`DemoRuleEngineAdapter`)
- Default out-of-the-box engine requiring **zero external API keys or cloud spend**.
- Evaluates submitted content against active brand guidelines using pattern matching, regular expressions, and document structure parsers.
- Compares claims directly with **Approved Sources** (e.g., pricing tables, market reports, company specifications).
- Produces 100% reproducible, verifiable results with citations, evidence, and confidence scores.

### External LLM Providers (`ExternalLLMAdapter`)
- Plugs into OpenAI GPT-4o, Google Gemini, or Anthropic Claude when API credentials are provided in `.env`.
- Uses strict JSON schema enforcement to ensure structured findings.
- Gracefully falls back to the deterministic demo engine if external API quotas or network timeouts occur.

---

## 3. The Three Key Architectural Improvements

### IMPROVEMENT 1: Evidence-Linked AI Review
Every finding must cite an active brand guideline (`guidelineRef`) or verified source (`sourceRef`) with supporting evidence. Unsupported claims are classified explicitly as **Unverified** rather than automatically labeled false.

### IMPROVEMENT 2: Human-Controlled Revision & Approval
- Segregation of duties: Content creators **cannot** approve their own submissions.
- Revisions maintain version history (`v1 -> v2 -> v3...`). Original text is never silently overwritten.
- Reviewers and Brand Managers can request changes with mandatory reasons or approve publication with an immutable audit log.
- Critical unresolved findings prevent approval even if overall compliance score is high.

### IMPROVEMENT 3: Continuous Governance Intelligence
- Aggregates recurring terminology errors, unsupported claims, and average revisions per item.
- Identifies ambiguous or frequently violated guidelines and surfaces automated governance recommendations.

---

## 4. Database Schema (Prisma Relational Model)

- **`User`**: Accounts with roles (`CREATOR`, `BRAND_MANAGER`, `REVIEWER`, `ADMIN`).
- **`Workspace`** & **`WorkspaceMembership`**: Multi-tenant workspace isolation.
- **`BrandGuideline`** & **`GuidelineVersion`**: Guidelines across 8 categories with version change tracking.
- **`ApprovedSource`**: Authoritative ground truth facts, pricing, statistics, and disclaimers.
- **`BrandAsset`**: Logos, icons, color tokens, and usage restrictions.
- **`ContentReview`**: Review records with status, current version, scores, and issue counters.
- **`ContentVersion`**: Immutable version history for content drafts.
- **`Finding`**: Specific compliance issues with category, severity, evidence, citation, and confidence.
- **`SuggestedCorrection`**: Proposed text replacements with acceptance tracking.
- **`Comment`**: Threaded feedback between creators and reviewers.
- **`ApprovalDecision`**: Formal sign-off, change requests, or rejections.
- **`AuditEvent`**: Detailed audit trail for enterprise governance.
- **`Notification`**: In-app notifications for workflow events.

---

## 5. Document & Image Processing Pipeline

- **TXT / Markdown**: Parsed directly with character and word counters.
- **PDF Extraction**: Processed safely via `pdf-parse` without shell execution.
- **DOCX Extraction**: Raw text extracted safely via `mammoth`.
- **Visual Assets**: Inspected for format, size, dimensions, and clear-space compliance.
- Strict upload size limits (15MB) and mime-type whitelists prevent malicious file uploads.
