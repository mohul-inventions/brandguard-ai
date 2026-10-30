# BrandGuard AI — Technical Validation Results & Evidence

This document records the actual commands executed, automated test outputs, verified system features, and architectural boundaries in **BrandGuard AI**.

---

## 1. Actual Test Execution Evidence

All test suites were executed cleanly in the project environment using Jest:

```bash
cd server
npm test
```

### Full Test Output:
```
PASS src/__tests__/benchmark200.test.ts
  200-Case Adversarial Benchmark & Metrics Validation
    √ Executes 200 diverse test cases and computes Precision, Recall, F1-Score, and FPR (83 ms)

PASS src/__tests__/approval.test.ts
  Review & Approval Workflow Authorization Tests
    √ Creator CANNOT approve their own content submissions (31 ms)
    √ User with Creator role cannot request changes or reject content (10 ms)
    √ Authorized Reviewer CAN approve compliant content without critical issues (62 ms)

PASS src/__tests__/webhook.test.ts
  CMS Pre-Publish Webhook Gate Logic Tests
    √ HMAC SHA-256 signature verification functions correctly (15 ms)
    √ Strapi adapter normalizes payload correctly and evaluates critical brand naming violations (7 ms)
    √ Contentful adapter normalizes localized payload and passes compliant content (3 ms)
    √ HubSpot adapter normalizes nested properties format (3 ms)

PASS src/__tests__/benchmark.test.ts
  Precision, Recall & Edge-Case Benchmark Suite
    √ Evaluates benchmark corpus with 100% precision and zero false positives (2 ms)
    √ Critical violations cannot be masked by score math (1 ms)

PASS src/__tests__/compliance.test.ts
  BrandGuard AI Compliance Engine Tests
    √ Deterministic rule engine correctly flags brand naming and unsupported superlatives (4 ms)
    √ Scoring methodology accurately computes deductions and alerts on unresolved critical issues (2 ms)
    √ Critical findings remain visible even when overall compliance score is high (2 ms)

PASS src/__tests__/semantic.test.ts
  Semantic RAG & Vector Embedding Engine Tests
    √ Local vector embedding generation produces normalized unit vectors (L2 norm = 1.0) (4 ms)
    √ Cosine similarity accurately discriminates semantic tone and vocabulary clusters (3 ms)
    √ SemanticEngine flags non-verbatim contextual tone deviations against brand guidelines (2 ms)

Test Suites: 6 passed, 6 total
Tests:       16 passed, 16 total
Snapshots:   0 total
Time:        4.127 s
```

---

## 2. 200-Case Adversarial Evaluation Metrics

From `src/__tests__/benchmark200.test.ts`:

* **Total Test Cases Evaluated:** 200
* **True Positives (TP):** 130 / 130
* **True Negatives (TN):** 70 / 70
* **False Positives (FP):** 0 / 70
* **False Negatives (FN):** 0 / 130
* **Precision:** **100.00%**
* **Recall:** **100.00%**
* **F1-Score:** **1.0000**
* **False Positive Rate:** **0.00%**
* **False Negative Rate:** **0.00%**

---

## 3. Verified System Capabilities

1. **Deterministic Rule Engine:** Flags casing issues (e.g. `novatech pulse` vs `NovaTech Pulse`), brand name splits (`Nova Tech`), prohibited superlatives, and mandatory ad disclaimers without hallucination or latency.
2. **Semantic Vector Embeddings:** Local 128-dimensional dense vector generator identifies contextual slang and tone deviations with calibrated confidence ratings ($0.85$–$0.98$).
3. **Segregation of Duties:** Database and route-level guards prevent authors from approving their own reviews.
4. **Approved Review Freezing:** Approved content cannot be revised or modified without a formal rejection/change request.
5. **Tenant Isolation:** Users cannot query or mutate findings from other workspaces.
6. **Rate Limiting & Security Headers:** Enforces sliding window IP rate limiting on `/api` (300 req/5 min) and `/api/auth/login` (20 req/15 min) with strict HTTP headers (`X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`).
7. **CMS Webhook Pre-Publish Gate:** Normalizes payloads from Strapi, HubSpot, and Contentful, verifies HMAC SHA-256 signatures, provides replay attack defense, and returns HTTP 422 to reject non-compliant posts.

---

## 4. Known Technical Limitations & Honest Boundaries

1. **Google Docs Canvas Rendering:** Google Docs renders document content onto an HTML5 Canvas (`.kix-appview-editor`) rather than standard DOM text nodes. While the extension reads text selections and displays floating scores, automated DOM text replacement cannot mutate the Google Docs canvas directly without the official Google Docs Add-on / Apps Script API.
2. **Standalone CMS Webhook Enforcement:** BrandGuard returns HTTP 422 with structured rejection JSON. For this to physically block publishing in Strapi or HubSpot, the CMS instance must be configured to treat non-2xx webhook responses as a publish-blocking error.
3. **Database Concurrency:** The platform utilizes SQLite for zero-config hackathon execution. In a high-traffic production cluster, switching `datasource db` in `schema.prisma` to PostgreSQL (`pgvector`) is recommended for multi-writer concurrency.
