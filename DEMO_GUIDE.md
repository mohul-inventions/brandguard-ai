# BrandGuard AI — 5-Minute Live Hackathon Demo Guide

Follow this minute-by-minute demonstration script to showcase the core enterprise capabilities of **BrandGuard AI** to the judges.

---

## Pre-Demo Checklist (1 Minute Before Presentation)
1. **Start Backend Server:**
   ```bash
   cd server
   npm run dev
   # Server runs on http://localhost:5000
   ```
2. **Start Frontend (if in dev mode) or open production port:**
   ```bash
   cd client
   npm run dev
   # Frontend runs on http://localhost:5173
   ```
3. **Open Chrome with Extension Loaded:**
   * Go to `chrome://extensions` $\rightarrow$ enable Developer Mode $\rightarrow$ Click **Load unpacked** $\rightarrow$ select `brandguard-ai/extension`.

---

## 5-Minute Live Demonstration Flow

### Minute 1: The Problem & The Governance Platform (0:00 - 1:00)
1. **Navigate to:** `http://localhost:5173/login`
2. **Action:** Click **"Creator (Alex Rivera)"** via 1-Click Demo Login.
3. **Narrative:**
   > *"Modern enterprise marketing and PR teams publish hundreds of pieces of copy weekly. Non-compliant claims, naming inconsistencies, and missing disclaimers introduce legal liability and brand drift. BrandGuard AI is an automated, evidence-linked governance platform that enforces multi-dimensional compliance before publication."*
4. **Showcase:** Point out the **Governance Telemetry Dashboard** showing compliance score distribution, review velocity, and top-violated guidelines.

---

### Minute 2: Content Submission & 8D Compliance Engine (1:00 - 2:00)
1. **Navigate to:** **New Review** (`/reviews/new`)
2. **Action:** Click the top-right button: **"Load NovaTech Demo Content"**.
   * It auto-populates campaign title, channel, and non-compliant copy:
     > *"Introducing Nova Tech Pulse - the world's number one productivity platform! 🚀 Tired of clunky collaboration tools? With our mind-blowing synergy, your distributed team will achieve insane speed and 100% guarantee of zero missed deadlines. Upgrade to our Pro tier today for only $10/user..."*
3. **Action:** Click **"Run BrandGuard Compliance Review"**.
4. **Result:**
   * Review detail page immediately opens with an **Overall Compliance Score of ~62% (Needs Revision)**.
   * Point out the **8-Dimensional Breakdown Chart** (Terminology, Voice, Claims, Disclaimers, Pricing Accuracy).
   * Show the line-level findings with exact excerpts, guideline citations, and explanations.

---

### Minute 3: 1-Click Suggestion Remediation & Immutable Versions (2:00 - 3:00)
1. **Narrative:**
   > *"BrandGuard doesn't just flag problems—it provides 1-click remediation that creates immutable draft versions."*
2. **Action:**
   * On the **"Nova Tech"** finding $\rightarrow$ click **"Apply Suggestion"** (replaces with *"NovaTech Pulse"*).
   * On the **"100% guarantee"** claim $\rightarrow$ click **"Apply Suggestion"** (replaces with *"a proven track record"*).
   * On the **"$10/user"** pricing contradiction $\rightarrow$ click **"Apply Suggestion"** (replaces with approved pricing *"12/user/month"*).
3. **Action:** Click **"Save Version 2 & Re-Score"**.
4. **Result:**
   * Compliance score updates from **62% $\rightarrow$ 100% (Compliant)**.
   * Show the **Version Selector (`v1` vs `v2`)** illustrating the immutable revision tree.
5. **Action:** Click **"Submit for Review"** (Alex Rivera submits to the review queue).

---

### Minute 4: Role-Based Approval Gate & Immutability (3:00 - 4:00)
1. **Test Segregation of Duties:**
   * While logged in as Alex (Creator), attempt to approve: note that approval controls are restricted.
2. **Switch Persona:**
   * Log out $\rightarrow$ Click **"Reviewer (Marcus Sterling)"** via 1-Click Demo Login.
3. **Navigate to:** `/approvals` $\rightarrow$ Open Alex's submitted review.
4. **Action:** Click **"Approve Content"** $\rightarrow$ enter approval reason: *"All terminology and claims verified compliant."*
5. **Result:**
   * Review status transitions to **`APPROVED`**.
   * Demonstrate **Approved Content Freezing**: explain to judges that all further edits or status tampering are locked at the database level to guarantee compliance integrity.

---

### Minute 5: Chrome Extension & CMS Pre-Publish Webhook Gate (4:00 - 5:00)
1. **Chrome Extension (In-Situ Writing Assistant):**
   * Open any web textarea or WordPress Gutenberg tab.
   * Click the BrandGuard icon in the toolbar $\rightarrow$ click **1-Click Demo Login**.
   * Type: *"Nova Tech provides 100% foolproof cloud collaboration."*
   * Show the **live floating pill** at the bottom right immediately alerting the writer with real-time score.
   * Open popup $\rightarrow$ click **Fix** $\rightarrow$ phrase is automatically replaced in the active editor.
2. **CMS Webhook Pre-Publish Gate:**
   * Open a terminal and run the Strapi pre-publish gate test:
     ```bash
     curl -s -X POST http://localhost:5000/api/webhooks/cms/strapi \
       -H "Content-Type: application/json" \
       -d '{"event":"entry.publish","entry":{"id":101,"title":"Ad","content":"Nova Tech is #1 in the world!"}}'
     ```
   * Show the response: **HTTP 422 BLOCKED** with structured violation details.
3. **Conclude:**
   > *"BrandGuard AI turns brand guidelines from passive PDF documents into active, automated guardrails across web browsers, internal teams, and enterprise publishing pipelines."*
