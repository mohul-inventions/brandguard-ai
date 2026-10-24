# BrandGuard AI — Hackathon Judging & Demo Walkthrough Script

This step-by-step walkthrough demonstrates the end-to-end functionality of **BrandGuard AI** using the seeded **NovaTech** company scenario.

---

## Persona Quick Reference (1-Click Switcher)

You can switch personas at any time using the **Demo Role** dropdown in the top header:
- **Alex Rivera** (`CREATOR`): Content author submitting marketing campaigns.
- **Marcus Sterling** (`REVIEWER`): Compliance reviewer responsible for quality gates.
- **Elena Vance** (`BRAND_MANAGER`): Brand guardian configuring rules and approved facts.
- **Sarah Chen** (`ADMIN`): Platform administrator managing roles and policies.

---

## 5-Minute Evaluation Walkthrough

### Step 1: Log in as Creator (Alex Rivera)
1. Open `http://localhost:5173/login`.
2. Click the **"Alex Rivera (Creator)"** card to log in instantly.
3. You land on the **Overview Dashboard** displaying live compliance telemetry, score trends, and active violations.

### Step 2: Submit a New Review with Non-Compliant Copy
1. Click **"New Review"** in the sidebar (or top right button).
2. Click the gradient button **"Load NovaTech Demo Content"**.
3. Notice that the form automatically populates with realistic launch copy containing:
   - Split product naming: `"Nova Tech Pulse"`
   - Unsupported superlative claim: `"the world's number one productivity platform"`
   - Over-hyped slang: `"mind-blowing synergy"`, `"insane speed"`
   - Absolute guarantee: `"100% guarantee of zero missed deadlines"`
   - Erroneous pricing: `"only $10/user"`
   - Missing required ad disclaimer: `"Features may vary by subscription plan"`
4. Click **"Submit & Run AI Compliance Review"**.

### Step 3: Inspect the AI Correction Workspace
1. You are immediately taken to the **Side-by-Side Correction Workspace** (`/reviews/:id`).
2. Observe the calculated compliance score (e.g., 52%) and the **Red Critical Issues Banner**.
3. Under the **Findings Tab** on the right panel, inspect the evidence-linked issues:
   - **Incorrect Brand Name**: Cites *Official Product Naming & Spelling (v1)* with proposed fix `"NovaTech Pulse"`.
   - **Unsupported Superlative**: Cites *G2 Winter 2026 Report* proving NovaTech is #2, not #1.
   - **Outdated Pricing Claim**: Cites *FY2026 Official Pricing Schedule* ($12/user/month).
   - **Missing Advertising Disclaimer**: Cites *Legal Disclaimer Standards*.

### Step 4: Apply AI Suggestions & Save New Revision
1. Click **"Accept & Apply"** on individual findings, or click **"Apply All Safe Corrections"**.
2. Notice that the left editor updates automatically with the corrected text:
   - `"Nova Tech Pulse"` becomes `"NovaTech Pulse"`.
   - `"the world's number one..."` becomes `"an industry-leading productivity platform for distributed teams"`.
   - `"$10/user"` becomes `"$12/user/month"`.
3. In the left panel, click **"Save as v2"**.
4. The system saves Version 2, re-runs compliance analysis, and recalculates the score upwards (e.g. 96%)!

### Step 5: Test Segregation of Duties (Human Review Gate)
1. Still as Alex Rivera (`CREATOR`), notice that **"Approve Review"** is not available, protecting against self-approvals.
2. Open the **Demo Role** dropdown in the top header and switch to **Marcus Sterling (Reviewer)**.
3. Now you see the reviewer controls:
   - Click **"Discussion"** to add a reviewer comment.
   - Click **"Approve Review"**, enter an approval note, and confirm.
4. The review transitions to **APPROVED** and is sealed with an immutable audit entry.

### Step 6: Explore Governance Analytics & Guidelines
1. Click **"Analytics"** in the sidebar.
2. Review **Actionable Governance Recommendations** generated from stored database violations (e.g., advising guideline updates for frequent naming errors).
3. Click **"Brand Guidelines"** to see active versioning, or **"Brand Assets"** to view approved corporate design tokens.

---

## Key Highlights for Judges

- **Zero Fake Results**: Every finding, score, and chart is powered by database persistence and actual rule evaluation.
- **Evidence Citations**: Unsupported claims are explicitly flagged with source benchmarks.
- **Segregation of Duties**: Creators cannot approve their own submissions.
- **Continuous Intelligence**: Analytics surface systemic compliance bottlenecks.
