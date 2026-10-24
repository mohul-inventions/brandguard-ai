# BRANDGUARD AI 🛡️
### Intelligent Brand Governance & Content Compliance Platform

> Built for the Inkloom AI Hackathon Challenge

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646cff.svg)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.22-2D3748.svg)](https://www.prisma.io/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)
[![Test Suite](https://img.shields.io/badge/Tests-Passing-22c55e.svg)]()

---

## 1. Executive Summary & Vision

Modern enterprises create hundreds of pieces of digital collateral across social media, advertising campaigns, blog posts, whitepapers, and sales collateral. A single off-brand superlative, outdated pricing statement, or missing regulatory disclaimer can trigger severe legal penalties, FTC complaints, or brand dilution.

**BrandGuard AI** is an intelligent content governance and compliance platform that inspects content against approved corporate guidelines, voice profiles, authoritative ground-truth sources, and accessibility standards prior to publication.

### Key Capabilities:
- **8 Analysis Categories**: Brand Voice, Terminology, Factual Accuracy, Promotional Claims, Brand Messaging, Visual Compliance, Accessibility, and Confidentiality.
- **Evidence-Linked Findings**: Every issue provides the exact text excerpt, rationale, guideline citation, verified source citation, confidence level, and suggested correction.
- **Human-in-the-Loop AI Correction Workspace**: Side-by-side editing environment allowing creators to inspect highlights, apply suggested replacements with one click, and save immutable version drafts (`v1 -> v2`).
- **Segregation of Duties & Approval Controls**: Content creators cannot approve their own submissions. Reviewers and Brand Managers inspect findings, request revisions, and formally sign off on publication.
- **Continuous Governance Intelligence**: Analytics identify recurring violations and potentially ambiguous guidelines to improve organizational compliance over time.

---

## 2. The Three Key Improvements

### 🔹 IMPROVEMENT 1 — Evidence-Linked AI Review
Every finding links directly to an active brand guideline (`guidelineRef`) or verified source (`sourceRef`) and explains the exact reasoning for the flag. Crucially, unsupported claims are categorized as **Unverified** rather than automatically assumed false, providing nuanced decision support.

### 🔹 IMPROVEMENT 2 — Human-Controlled Revision & Approval
The system enforces strict segregation of duties. Creators retain full editorial control over draft copy and must accept suggestions intentionally. Reviewers can request changes with mandatory reasons or approve content. The backend strictly prohibits creators from self-approving their own submissions.

### 🔹 IMPROVEMENT 3 — Continuous Governance Intelligence
Rather than treating each review as an isolated check, BrandGuard AI aggregates violation patterns across departments and content types. It flags recurring naming errors and surfaces actionable governance recommendations (e.g. recommending guideline updates for ambiguous terminology).

---

## 3. Technology Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Lucide React icons, Recharts telemetry charts, React Router v6.
- **Backend**: Node.js, Express.js, TypeScript, REST API architecture.
- **Persistence**: SQLite with Prisma ORM for seamless, zero-configuration local setup. Designed with clean abstractions for instant migration to PostgreSQL.
- **Document & Image Processing**: Multer for secure multipart uploads, `pdf-parse` for PDF text extraction, `mammoth` for DOCX parsing, metadata inspections for PNG/JPG/SVG/WEBP.
- **AI Engine Architecture**: Provider Adapter Pattern supporting:
  - **Deterministic Demo Rule Engine** (Default, zero API keys required, 100% reproducible and verifiable).
  - **External LLM Adapter** (OpenAI GPT-4o, Google Gemini, Anthropic Claude with strict JSON schema validation).

---

## 4. Quick Start & Local Setup

### Prerequisites
- Node.js (v18 or higher recommended; developed on Node v24)
- npm (v9+)

### Installation & Database Setup

1. **Clone or navigate to the repository**:
   ```bash
   cd brandguard-ai
   ```

2. **Install all dependencies** (Server and Client):
   ```bash
   cd server && npm install
   cd ../client && npm install
   cd ..
   ```

3. **Initialize the Database**:
   ```bash
   cd server
   npx prisma generate
   npx prisma db push
   npx ts-node prisma/seed.ts
   cd ..
   ```

4. **Start the Development Servers**:
   - **Backend API Server** (Port 5000):
     ```bash
     cd server && npm run dev
     ```
   - **Frontend Vite Client** (Port 5173, in a separate terminal):
     ```bash
     cd client && npm run dev
     ```

5. **Open Application**:
   Navigate to [http://localhost:5173](http://localhost:5173).

---

## 5. Demo Logins & Persona Switching

The application comes pre-seeded with the fictional **NovaTech Global** workspace. You can log in using standard credentials, or use the **1-Click Demo Persona Switcher** on the login screen or in the top header:

| Persona | Name | Role | Email | Password | Primary Permissions |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Creator** | Alex Rivera | `CREATOR` | `creator@novatech.io` | `password123` | Submit content, apply AI fixes, save revisions |
| **Reviewer** | Marcus Sterling | `REVIEWER` | `reviewer@novatech.io` | `password123` | Inspect findings, request changes, approve |
| **Brand Manager** | Elena Vance | `BRAND_MANAGER` | `manager@novatech.io` | `password123` | Manage guidelines, facts, and brand assets |
| **Administrator** | Sarah Chen | `ADMIN` | `admin@novatech.io` | `password123` | Manage user roles, permissions, settings |

---

## 6. Running Automated Tests

Run the backend test suite:
```bash
cd server
npm test
```

### Verified Scenarios:
- Deterministic compliance engine flags split brand naming, unverified superlatives, and pricing discrepancies.
- Deterministic scoring methodology accurately calculates deductions and warns on unresolved critical findings.
- Critical findings remain prominently flagged even if the overall compliance score is high.
- Segregation of duties prevents creators from approving their own submissions.
- Authorized reviewers can approve compliant submissions with audit trail logging.

---

## 7. Production Build

To produce optimized production builds:

```bash
# Build backend TypeScript
cd server && npm run build

# Build frontend bundle
cd ../client && npm run build
```

The compiled frontend is output to `client/dist/` and can be served statically or proxied behind Nginx / Cloudflare Pages.

---

## 8. Environment Variables

See `.env.example` at the repository root:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="replace-with-a-secure-random-secret"
CLIENT_ORIGIN="http://localhost:5173"

# AI Provider: 'demo' (default), 'openai', 'gemini', or 'anthropic'
AI_PROVIDER=demo

# Optional: Add external API keys if AI_PROVIDER is set to external models
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
```

---

## 9. Limitations & AI Disclosure

- **Demo vs. Real AI**: In default demonstration mode (`AI_PROVIDER=demo`), the platform executes a deterministic rule engine to ensure 100% reproducible evaluations for judges without requiring paid API credits. If an OpenAI or Gemini API key is provided, the application routes requests to the external model via the adapter.
- **Visual Compliance Scope**: Image asset checks verify format, dimensions, file size, and basic contrast. Deep computer vision logo matching (e.g. clear space margin measurement) is labeled as requiring human reviewer confirmation.
- **Single Database File**: The MVP utilizes SQLite for simple local installation. The Prisma schema is 100% compatible with PostgreSQL for production scale.
