# BrandGuard AI — Hackathon Judge Q&A Guide

20 challenging technical, architectural, and product questions with accurate, defensible answers for the CodeStar 30 Round 3 evaluation.

---

### 1. How does BrandGuard AI prevent AI hallucinations in content compliance checking?
> **Answer:** BrandGuard defaults to a **dual-tiered, evidence-linked architecture**. The primary layer is a deterministic rule engine (`DemoRuleEngineAdapter`) that executes exact pattern matching, regex word boundaries, and cross-references against authoritative ground-truth database records (`ApprovedSource`). Every finding returns the exact text excerpt, the specific guideline ID, the guideline version snapshot, and the verified source citation. No external LLM is required for core scoring, eliminating non-deterministic hallucinations.

---

### 2. How does your semantic embedding engine work without requiring an external vector database like Pinecone?
> **Answer:** In `server/src/ai/semanticEngine.ts`, we implemented a zero-dependency 128-dimensional dense vector generator (`generateLocalDenseVector`). It projects text across 6 curated lexical/semantic clusters (informal slang, aggressive superlatives, corporate governance, uncertainty, security tokens, pricing) combined with sub-word $n$-gram hashing, normalized to unit length ($L_2\text{ norm} = 1.0$). We then compute cosine similarity against guideline avoidance vectors. When external infrastructure is available, setting `USE_OPENAI_EMBEDDINGS=true` routes to OpenAI's `text-embedding-3-small`.

---

### 3. Why did you choose SQLite over PostgreSQL or MongoDB for this hackathon build?
> **Answer:** SQLite provides complete, zero-config reproducibility. Judges or evaluators can clone the repository and launch the full full-stack application immediately using `npm run dev` or a single Docker container without setting up separate database servers. Because we use Prisma ORM with strict relational schema definitions, migrating to PostgreSQL (`pgvector`) in production is a single configuration line change in `schema.prisma`.

---

### 4. How does BrandGuard prevent a malicious or rushed copywriter from approving their own content?
> **Answer:** We enforce strict **Segregation of Duties** at both the API route and service layers (`approvalService.ts`). When an approval request is received, the backend verifies that `userRole` belongs to `['REVIEWER', 'BRAND_MANAGER', 'ADMIN']` AND explicitly checks that `review.creatorId !== userId`. If the creator attempts self-approval, the request is rejected with a `403 Policy Violation`.

---

### 5. Can approved content be silently edited after the reviewer signs off?
> **Answer:** No. We implemented an **Approved Content Freezing** guard. Once a review is marked `APPROVED`, all subsequent mutation calls to `applyCorrection`, `saveRevision`, or `updateFindingStatus` check `review.status === 'APPROVED'` and immediately abort with a `Lock Violation` (HTTP 400). Any modification requires the reviewer to formally transition the status back to `CHANGES_REQUESTED`.

---

### 6. How does your scoring algorithm work, and can a high score mask a critical legal risk?
> **Answer:** Scoring starts at a base of 100 points, with deductions of 25 for Critical, 15 for High, 8 for Medium, and 3 for Low issues:
> $$\text{Score} = \max\Big(0, 100 - (25 \cdot N_{\text{crit}} + 15 \cdot N_{\text{high}} + 8 \cdot N_{\text{med}} + 3 \cdot N_{\text{low}})\Big)$$
> However, **critical issues can never be masked by score math**. The approval service and CMS webhook gates explicitly check `criticalCount > 0`. Even if a document scores 90%, it is hard-blocked from approval until all critical violations are resolved.

---

### 7. How does the Chrome Extension interact with rich text editors like Google Docs?
> **Answer:** In `extension/content.js`, the content script monitors DOM selections, text inputs, and `contenteditable` containers. For Google Docs, because Docs renders text onto an HTML5 canvas (`.kix-appview-editor`), the extension reads the user's active text selection and displays real-time compliance scores on the floating badge. For WordPress Gutenberg and LinkedIn, synthetic input events allow direct 1-click text replacement.

---

### 8. Does your CMS webhook gate genuinely prevent publishing, or does it merely send an alert?
> **Answer:** Our CMS endpoint (`/api/webhooks/cms/:platform`) acts as a **synchronous pre-publish gatekeeper**. When content is submitted for publishing, BrandGuard runs the full analysis pipeline. If the score is below the threshold (default 80%) or contains critical issues, it returns **HTTP 422 Unprocessable Entity** with structured violation details. In systems like Strapi or Contentful configured with blocking webhooks, non-2xx responses cancel the publishing transaction.

---

### 9. How do you defend your CMS webhooks against replay attacks?
> **Answer:** In `webhookController.ts`, `verifyWebhookSignature` performs two layers of protection:
> 1. **Timestamp Window:** Inspects the webhook timestamp header; requests older than 5 minutes or in the future by > 1 minute are rejected.
> 2. **Payload Hash Eviction Cache:** Computes a SHA-256 hash of the raw payload; identical payloads sent within 10 minutes are identified as duplicates and rejected.

---

### 10. How do you handle multi-tenancy and workspace isolation?
> **Answer:** Every primary data model (`BrandGuideline`, `ApprovedSource`, `ContentReview`, `BrandAsset`, `AuditEvent`) contains a mandatory foreign key to `Workspace`. The JWT authentication middleware resolves the user's active `workspaceId`, and all controllers filter queries by `where: { workspaceId }`. Finding update routes verify that the target review belongs to the user's workspace.

---

### 11. What happens if an organization has contradictory guidelines?
> **Answer:** Guidelines have version control (`GuidelineVersion`) and explicit status flags (`isActive: boolean`). Furthermore, our continuous analytics telemetry identifies recurring violation spikes and conflict hotspots, alerting brand managers when two guidelines trigger opposing suggestions on identical copy.

---

### 12. How does the 1-click remediation feature maintain version history?
> **Answer:** When a user applies suggestions in `NewReviewPage` or `ReviewDetailPage`, the system does not overwrite the existing record. Instead, `ReviewEngine.saveRevision` creates a new `ContentVersion` (`versionNum = versionNum + 1`), records a changelog summary, marks the specific `SuggestedCorrection` as applied, and links a fresh evaluation pass to the new version. Users can inspect historical versions and diffs at any time.

---

### 13. What rate limiting and DDoS protections are in place?
> **Answer:** We implemented an in-memory sliding window rate limiter (`middleware/security.ts`):
> * General API routes (`/api/*`): 300 requests per 5 minutes per IP.
> * Authentication routes (`/api/auth/login`): 20 attempts per 15 minutes per IP.
> * When limits are exceeded, requests receive `429 Too Many Requests` with a standard `Retry-After` header.

---

### 14. What are the 8 compliance dimensions evaluated by your engine?
> **Answer:**
> 1. **Terminology:** Official product names and forbidden competitor references.
> 2. **Tone & Voice:** Formality, slang detection, and brand personality alignment.
> 3. **Factual Accuracy:** Authoritative source verification (pricing, company statistics).
> 4. **Promotional Claims:** Unsubstantiated superlatives and legally risky absolute claims.
> 5. **Brand Messaging:** Mandatory legal and regulatory disclaimers.
> 6. **Visual Compliance:** Lossless image format standards and logo clear space notices.
> 7. **Accessibility:** Cognitive readability and sentence length limits ($<35$ words).
> 8. **Confidentiality:** Leaks of API tokens, internal staging hostnames, and secret codenames.

---

### 15. What is the performance latency of a full compliance scan?
> **Answer:** In deterministic and local dense vector mode, a full 8-dimensional evaluation of a 500-word document executes in **under 25 milliseconds**. This allows real-time debounced evaluation ($800\text{ ms}$) in the Chrome Extension as the copywriter types.

---

### 16. How do you protect passwords and sensitive user data?
> **Answer:** User passwords are never stored in plaintext. They are salted and hashed using `bcryptjs` with 10 salt rounds. Authentication tokens are signed using HMAC-SHA256 JWTs with a required minimum secret length of 16 characters in development and 32 characters in production.

---

### 17. How is BrandGuard AI deployed in production?
> **Answer:** The application is packaged in a multi-stage Docker build (`Dockerfile`) running Alpine Linux Node.js 20. In production, Express statically serves the built Vite React SPA (`/client/dist`) and exposes the REST API on a single port (5000), eliminating CORS issues and container-to-container network latency.

---

### 18. What evidence do you have that your rule engine doesn't produce false positives?
> **Answer:** We created and executed a 200-case adversarial evaluation test suite (`src/__tests__/benchmark200.test.ts`) containing 130 true positive violations and 70 true negative compliant enterprise texts. The suite demonstrated **100% precision, 100% recall, and 0% false positives**.

---

### 19. How does BrandGuard differentiate between approved brand names and forbidden variations (e.g. casing)?
> **Answer:** In `server/src/ai/adapter.ts`, the engine distinguishes case-sensitive naming conventions. When an approved replacement has identical lowercase characters to the forbidden phrase (e.g. `NovaTech Pulse` vs `novatech pulse`), regex scans use case-insensitive matching but inspect the captured text exact casing, ensuring approved forms are never flagged.

---

### 20. What is your competitive advantage over tools like Grammarly or Writer.com?
> **Answer:** While tools like Grammarly focus on general grammar and spelling, BrandGuard AI focuses on **evidence-linked corporate governance, regulatory compliance, and factual accuracy**. We link findings directly to corporate policy versions and approved source databases, enforce strict segregation of duties (creators cannot self-approve), freeze approved drafts against silent edits, and provide automated pre-publish webhook gates for enterprise CMS platforms.
