# BRANDGUARD AI 🛡️
### Intelligent Brand Governance & Content Compliance Platform
> **Built for CodeStar 30 Hackathon — Round 3 Final Submission**  
> **Problem Statement Challenge by Inkloom AI**  
> **Author & Solo Builder:** C R Mohul Ram (`mohulram07@gmail.com` | Amrita Vishwa Vidyapeetham)

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Test Suite](https://img.shields.io/badge/Tests-13%20Passed-22c55e.svg)]()
[![Manifest V3](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-blueviolet.svg)]()

---

## 1. Executive Summary & Round 3 Enhancements

Modern decentralized enterprises publish hundreds of marketing pieces weekly across social channels, blogs, whitepapers, PR releases, and ad campaigns. Manual proofreading is slow, creates multi-day release bottlenecks, and misses non-compliant claims.

**BrandGuard AI** is an intelligent content governance and compliance platform that inspects content prior to publication against active corporate guidelines, approved ground-truth facts, legal disclaimer standards, and accessibility requirements.

### Round 3 Milestone Deliverables:
1. **Chrome Browser Extension (Manifest V3)**:
   - In-situ real-time compliance scanner running inside web text editors, Google Docs, WordPress Gutenberg, and LinkedIn.
   - Live floating pill indicator displaying compliance scores and issue count.
   - One-click suggestion insertion directly into editable fields.
2. **Semantic RAG with Vector Embeddings**:
   - Dense 128-dimensional embedding representations (`EmbeddingService`) with cosine similarity thresholding (`SemanticEngine`).
   - Flags contextual tone deviations, informal street slang, and passive voice that bypass literal keyword/regex matches.
3. **CMS Pre-Publish Webhook Gate**:
   - Pre-publish validation gate for **Strapi**, **HubSpot**, and **Contentful**.
   - HMAC SHA-256 signature verification ensuring secure webhook delivery.
   - Configurable compliance thresholds (defaults to 80% + zero critical violations). Returns HTTP 200 (Allow Publish) or HTTP 422 (Block Publish with actionable violation reports).

---

## 2. Technology Stack

- **Frontend**: React 18, Vite 5, TypeScript 5, Tailwind CSS 3, Lucide React, Recharts 2.15, React Router v6.
- **Backend**: Node.js v24, Express.js 4, TypeScript, Prisma ORM 5.22, Multer, `pdf-parse`, `mammoth`.
- **Database**: SQLite (default local zero-config; ready for 1-line switch to PostgreSQL).
- **Dual-Layer Review Engine**:
  - **Deterministic Rule Engine (Default, 100% Offline)**: Uses exact matching, regex boundaries, negative phrase registries, and approved source cross-referencing. Zero external API keys needed; 100% reproducible.
  - **External LLM Adapter**: Pluggable support for OpenAI GPT-4o, Google Gemini, and Anthropic Claude with strict JSON schema validation.

---

## 3. Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher; tested on Node v20 & v24)
- npm (v9+)

### Installation
```bash
git clone <repo-url>
cd brandguard-ai

# Install root, backend, and frontend dependencies
npm --prefix server install
npm --prefix client install
```

### Database Initialization & Seeding
```bash
cd server
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
cd ..
```

### Running Locally (Development Mode)
Run both backend and frontend concurrently in two terminals:

**Terminal 1 — Backend API Server (Port 5000)**:
```bash
cd server
npm run dev
```

**Terminal 2 — Frontend Client (Port 5173)**:
```bash
cd client
npm run dev
```

Open your browser at **`http://localhost:5173`**.

---

## 4. Single-Port Full-Stack Mode (Unified Server)
The backend is configured to automatically serve the compiled frontend (`client/dist`) and static uploaded files from port `5000`:

```bash
# 1. Build frontend
npm --prefix client run build

# 2. Build backend
npm --prefix server run build

# 3. Start unified production server
npm --prefix server start
```
Now access the entire application directly at **`http://localhost:5000`**!

---

## 5. Demo Logins & Persona Switching

On the Login screen (`/login`), click any **1-Click Demo Evaluation Sign In** card or enter credentials:

| Persona | Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- | :--- |
| **Alex Rivera** | `Creator` | `creator@novatech.io` | `Password123!` | Create & edit drafts, apply suggestions, resubmit. |
| **Marcus Sterling** | `Reviewer` | `reviewer@novatech.io` | `Password123!` | Inspect findings, request changes, approve compliant reviews. |
| **Elena Vance** | `Brand Manager` | `manager@novatech.io` | `Password123!` | Manage brand guidelines, approved facts, and brand assets. |
| **Sarah Chen** | `Administrator` | `admin@novatech.io` | `Password123!` | Full user management, workspace administration, and audit logs. |

*Note: You can switch active personas anytime using the **Demo Role Switcher** dropdown in the top header without logging out!*

---

## 6. End-to-End Evaluation Walkthrough (For Judges)

1. **Sign in as Creator**: Click **"Alex Rivera (Creator)"** on `/login`.
2. **Submit Content**:
   - Navigate to **"New Review"** in the sidebar.
   - Click the purple **"Load NovaTech Demo Content"** button in the header. This pre-fills content with intentional violations:
     - Unapproved brand name (`Nova Tech Pulse`).
     - Exaggerated superlative (`the world's number one productivity platform`).
     - Absolute guarantee (`100% guarantee`).
     - Outdated pricing (`only $10/user`).
     - Missing mandatory promotional disclaimer.
   - Click **"Analyze Content Compliance"**.
3. **Inspect Evidence-Linked Findings**:
   - You are redirected to the **AI Correction Workspace** (`/reviews/:id`).
   - Notice the low score and highlighted findings cards across Terminology, Promotional Claims, Factual Accuracy, Brand Voice, and Messaging.
4. **Apply Corrections**:
   - Click **"Apply All Safe Corrections"** or click **"Apply Correction"** on individual cards.
   - Watch the draft text update in real time with approved phrasing!
   - Click **"Save Revised Draft (v2)"**.
   - The engine generates Version 2, updates change diffs, and re-evaluates compliance (score jumps to 100%).
5. **Test Segregation of Duties**:
   - Notice that while logged in as Creator, the **Approve Review** button is blocked.
6. **Switch Persona & Sign Off**:
   - In the top header, click **"Demo Role: CREATOR"** $\rightarrow$ switch to **"Marcus Sterling (Senior Reviewer)"**.
   - Now click **"Approve Review"**, enter an approval note, and sign off.
   - The review transitions to `APPROVED`, and decision timestamps are permanently logged.
7. **View Governance Analytics**:
   - Navigate to **"Analytics"** in the sidebar to view violation trends, recurring terminology errors, and turnaround velocity.

---

## 7. Automated Tests & Build Verification

Run the test suite:
```bash
npm --prefix server test
```

### Verified Test Results:
```text
PASS src/__tests__/compliance.test.ts
  BrandGuard AI Compliance Engine Tests
    ✓ Deterministic rule engine correctly flags brand naming and unsupported superlatives (7 ms)
    ✓ Scoring methodology accurately computes deductions and alerts on unresolved critical issues (2 ms)
    ✓ Critical findings remain visible even when overall compliance score is high (1 ms)

PASS src/__tests__/approval.test.ts
  Review & Approval Workflow Authorization Tests
    ✓ Creator CANNOT approve their own content submissions (11 ms)
    ✓ User with Creator role cannot request changes or reject content (3 ms)
    ✓ Authorized Reviewer CAN approve compliant content without critical issues (37 ms)

Test Suites: 2 passed, 2 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        2.03 s
```

---

## 8. Deployment Instructions (Cloud & Production)

### Option A: Docker Deployment (Recommended)
A production-ready `Dockerfile` and `docker-compose.yml` are provided in the repository:

```bash
docker compose up --build -d
```
Access the application on port `5000`.

### Option B: Platform as a Service (Render, Railway, Fly.io)
1. **Repository**: Connect your GitHub repository.
2. **Build Command**:
   ```bash
   npm --prefix client install && npm --prefix client run build && npm --prefix server install && npm --prefix server run build
   ```
3. **Start Command**:
   ```bash
   cd server && npx prisma db push && node dist/index.js
   ```
4. **Environment Variables**:
   - `PORT=5000`
   - `NODE_ENV=production`
   - `DATABASE_URL=file:./dev.db` (or PostgreSQL URL)
   - `JWT_SECRET=your_super_secret_production_key`
   - `CLIENT_ORIGIN=https://your-domain.up.railway.app`
   - `AI_PROVIDER=demo`

---

## 9. Known Limitations & Production Roadmap

1. **Database Backend**: Defaults to SQLite for instant, zero-config local evaluation. For multi-instance scaling, switch `provider = "sqlite"` to `"postgresql"` in `server/prisma/schema.prisma`.
2. **Visual Logo Matching**: Measurable properties (dimensions, encoding, and color palette matching) run locally. Semantic logo pixel-matching is flagged as requiring human review or vision model enablement.
3. **External LLM Rate Limits**: In LLM mode, third-party provider latency depends on external API limits. The deterministic engine provides instant, 100% offline fallback.
