# BrandGuard AI — Demo Credentials & Environment Setup

This document outlines the demonstration user accounts, workspace configuration, and local launch credentials for the **CodeStar 30 Hackathon Round 3** live presentation.

---

## 1. Demo User Accounts

All demonstration accounts are pre-seeded in the database with role-based access control (RBAC).

| Persona / Role | Email Address | Password | Permissions & Intended Demo Actions |
| :--- | :--- | :--- | :--- |
| **Creator / Content Editor** | `creator@novatech.io` | `Password123!` | Submits draft reviews, loads demo campaign content, applies 1-click remediation fixes, submits reviews for approval. Strictly blocked from approving own content. |
| **Brand Manager / Reviewer** | `reviewer@novatech.io` | `Password123!` | Reviews submitted content versions, requests changes with formal reasons, approves compliant content, views compliance telemetry & heatmaps. |
| **Workspace Administrator** | `admin@novatech.io` | `Password123!` | Full workspace administrative controls, manages brand guidelines, approved source registries, and brand media assets. |

> **Pro Tip for Judges & Presenters:**  
> The login screen (`http://localhost:5173/login` or `http://localhost:5000/login`) features **1-Click Demo Login** buttons:
> * Click **"Creator (Alex Rivera)"** for instant editor view.
> * Click **"Reviewer (Marcus Sterling)"** for instant compliance reviewer view.
> * Click **"Brand Manager (Elena Vance)"** for brand governance authority view.

---

## 2. Default Workspace Details

* **Workspace Name:** `NovaTech Global`
* **Slug:** `novatech`
* **Industry:** Enterprise SaaS / Distributed Productivity Software
* **Core Product:** `NovaTech Pulse`

---

## 3. Environment Variables Configuration

Copy `.env.example` to `server/.env` if running locally:

```env
PORT=5000
NODE_ENV=development
DATABASE_URL="file:./dev.db"
JWT_SECRET="brandguard-super-secret-jwt-key-hackathon-2026"
CLIENT_ORIGIN="http://localhost:5173"

# AI Provider Configuration: 'demo' (default deterministic rule engine + semantic dense vectors)
AI_PROVIDER=demo

# Optional: Set to true if external OpenAI embeddings are configured
USE_OPENAI_EMBEDDINGS=false
OPENAI_API_KEY=

# CMS Pre-Publish Webhook Gate Settings
CMS_WEBHOOK_SECRET="brandguard-cms-webhook-secret-2026"
CMS_MIN_PUBLISH_SCORE=80
ENFORCE_WEBHOOK_SIGNATURE=false
```
