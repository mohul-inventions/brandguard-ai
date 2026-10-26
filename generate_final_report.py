import os
import sys
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether, HRFlowable
)
from reportlab.pdfgen import canvas
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT

class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Header on pages > 1
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 8)
            self.setFillColor(colors.HexColor("#4f46e5"))
            self.drawString(36, A4[1] - 26, "BRANDGUARD AI")
            self.setFont("Helvetica", 8)
            self.setFillColor(colors.HexColor("#64748b"))
            self.drawString(114, A4[1] - 26, "— CodeStar 30 Round 2 Final Project Report")
            self.drawRightString(A4[0] - 36, A4[1] - 26, "Inkloom AI Challenge")
            
            self.setStrokeColor(colors.HexColor("#cbd5e1"))
            self.setLineWidth(0.75)
            self.line(36, A4[1] - 30, A4[0] - 36, A4[1] - 30)

        # Footer on all pages
        self.setFont("Helvetica", 7.5)
        self.setFillColor(colors.HexColor("#64748b"))
        self.drawString(36, 22, "CONFIDENTIAL & PROPRIETARY — C. R. MOHUL RAM (Amrita Vishwa Vidyapeetham)")
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(A4[0] - 36, 22, page_text)
        
        self.setStrokeColor(colors.HexColor("#cbd5e1"))
        self.setLineWidth(0.75)
        self.line(36, 32, A4[0] - 36, 32)
        
        self.restoreState()

def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=38
    )

    styles = getSampleStyleSheet()

    # Brand Colors
    c_primary = colors.HexColor("#4f46e5")       # Violet Indigo
    c_navy = colors.HexColor("#0f172a")          # Deep Navy Slate
    c_cyan = colors.HexColor("#0284c7")          # Cyan Accent
    c_border = colors.HexColor("#cbd5e1")        # Border Slate
    c_card_bg = colors.HexColor("#f8fafc")       # Card Background
    c_text = colors.HexColor("#0f172a")          # Main Text
    c_muted = colors.HexColor("#475569")         # Muted Slate
    c_green = colors.HexColor("#16a34a")

    # Typography Styles
    title_cover = ParagraphStyle(
        'CoverTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=26,
        leading=30,
        textColor=colors.white,
        spaceAfter=6
    )

    subtitle_cover = ParagraphStyle(
        'CoverSubTitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=11,
        leading=15,
        textColor=colors.HexColor("#93c5fd"),
        spaceAfter=12
    )

    h1_style = ParagraphStyle(
        'Heading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=c_navy,
        spaceBefore=12,
        spaceAfter=5
    )

    h2_style = ParagraphStyle(
        'Heading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9.5,
        leading=13,
        textColor=c_primary,
        spaceBefore=7,
        spaceAfter=3
    )

    body_style = ParagraphStyle(
        'BodyDark',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.3,
        leading=11.6,
        textColor=c_text,
        spaceAfter=4
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.2,
        leading=11.4,
        textColor=c_text,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3
    )

    th_style = ParagraphStyle(
        'TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10,
        textColor=colors.white
    )

    td_style = ParagraphStyle(
        'TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.2,
        textColor=c_text
    )

    td_style_bold = ParagraphStyle(
        'TableCellBold',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.8,
        leading=10.2,
        textColor=c_text
    )

    badge_pill = ParagraphStyle(
        'BadgePill',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor("#38bdf8")
    )

    story = []

    # =========================================================================
    # SECTION 1: COVER PAGE
    # =========================================================================
    cover_header = [
        [Paragraph("CODESTAR 30 HACKATHON &nbsp;|&nbsp; ROUND 2: THE BUILD &nbsp;|&nbsp; FINAL PROJECT REPORT", badge_pill)],
        [Paragraph("BRANDGUARD AI", title_cover)],
        [Paragraph("Intelligent Brand Governance & Content Compliance Platform", subtitle_cover)],
    ]
    cover_table = Table(cover_header, colWidths=[523])
    cover_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), c_navy),
        ('LEFTPADDING', (0,0), (-1,-1), 18),
        ('RIGHTPADDING', (0,0), (-1,-1), 18),
        ('TOPPADDING', (0,0), (-1,-1), 16),
        ('BOTTOMPADDING', (0,0), (-1,-1), 16),
    ]))

    meta_grid_data = [
        [
            Paragraph("<font color='#64748b'>EVENT / TRACK</font><br/><b>CodeStar 30 — Round 2</b>", td_style),
            Paragraph("<font color='#64748b'>CHALLENGE SPONSOR</font><br/><b>Inkloom AI Challenge</b>", td_style_bold),
            Paragraph("<font color='#64748b'>AUTHOR / SOLO BUILDER</font><br/><b>C. R. Mohul Ram</b>", td_style_bold),
            Paragraph("<font color='#64748b'>ACADEMIC DEGREE</font><br/><b>B.Tech CSE</b>", td_style)
        ],
        [
            Paragraph("<font color='#64748b'>INSTITUTION</font><br/><b>Amrita Vishwa Vidyapeetham</b>", td_style),
            Paragraph("<font color='#64748b'>CAMPUS</font><br/><b>Nagercoil Campus</b>", td_style),
            Paragraph("<font color='#64748b'>GITHUB REPOSITORY</font><br/><b>mohul-inventions/brandguard-ai</b>", td_style_bold),
            Paragraph("<font color='#64748b'>VERIFICATION STATUS</font><br/><b>Build & Tests Passing (6/6)</b>", td_style_bold)
        ]
    ]
    meta_table = Table(meta_grid_data, colWidths=[130, 135, 145, 113])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor("#f1f5f9")),
        ('GRID', (0,0), (-1,-1), 0.75, c_border),
        ('TOPPADDING', (0,0), (-1,-1), 5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 5),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
    ]))

    story.append(cover_table)
    story.append(meta_table)
    story.append(Spacer(1, 10))

    # =========================================================================
    # SECTION 2: EXECUTIVE SUMMARY
    # =========================================================================
    story.append(Paragraph("2. Executive Summary", h1_style))
    story.append(Paragraph(
        "Modern decentralized organizations create hundreds of marketing collateral assets weekly across blog posts, social media, paid advertising, and press releases. Without an automated gatekeeping system, organizations face brand dilution, regulatory fines, and proofreading bottlenecks. <b>BrandGuard AI</b> is a complete, working content governance platform that inspects content prior to publication against approved brand guidelines and ground-truth company facts. It combines an automated 8-dimensional compliance engine with a human-in-the-loop revision workspace where creators review evidence-linked findings, apply fixes into versioned drafts (v1 &rarr; v2), and route content through strict role-segregated approval workflows.",
        body_style
    ))

    # =========================================================================
    # SECTION 3: PROBLEM STATEMENT
    # =========================================================================
    story.append(Paragraph("3. Problem Statement & Root Failures", h1_style))
    story.append(Paragraph("&bull; <b>Inconsistent Brand Voice:</b> Uncontrolled divergence between casual slang, jargon, and corporate brand personality guidelines.", bullet_style))
    story.append(Paragraph("&bull; <b>Unsupported Claims & Outdated Facts:</b> Authors make exaggerated marketing claims (e.g. <i>'world\\'s number one'</i>) or cite outdated pricing statements that contradict corporate source records.", bullet_style))
    story.append(Paragraph("&bull; <b>Incorrect Terminology & Missing Disclaimers:</b> Misspelled product marks (e.g. <i>'Nova Tech'</i> vs. <i>'NovaTech'</i>) and omitted statutory disclaimers (e.g., promotional variations) that create legal liability.", bullet_style))
    story.append(Paragraph("&bull; <b>Accessibility & Confidentiality Risks:</b> Sentences exceeding cognitive readability thresholds and inadvertent exposure of internal project codenames or tokens.", bullet_style))

    # =========================================================================
    # SECTION 4: PROPOSED SOLUTION
    # =========================================================================
    story.append(Paragraph("4. Proposed Solution & Workflow", h1_style))
    story.append(Paragraph(
        "BrandGuard AI provides an evidence-linked governance pipeline. For every finding, it explains: <i>(1) What is wrong, (2) Why it matters, (3) Supporting guideline or source citation, (4) Severity level, (5) Confidence score, and (6) Suggested replacement.</i> Critically, unsupported claims are categorized as <b>Unverified</b> rather than falsely assumed false. Creators review suggestions in a side-by-side diff workspace, apply corrections into immutable draft versions, and submit them for formal sign-off.",
        body_style
    ))

    # =========================================================================
    # SECTION 5: SYSTEM ARCHITECTURE
    # =========================================================================
    story.append(Paragraph("5. System Architecture & Technical Design", h1_style))
    story.append(Paragraph(
        "The application is built on a clean monorepo architecture with strict separation between presentation, business logic, persistence, and evaluation:",
        body_style
    ))

    arch_data = [
        [Paragraph("<b>Layer / Subsystem</b>", th_style), Paragraph("<b>Implemented Components (Verified in Codebase)</b>", th_style), Paragraph("<b>Planned Enhancements</b>", th_style)],
        [
            Paragraph("<b>Frontend (Client)</b>", td_style_bold),
            Paragraph("React 18, Vite 5, TypeScript 5, Tailwind CSS, Lucide React, Recharts analytics telemetry, React Router v6 SPA.", td_style),
            Paragraph("Browser extension (Google Docs/Figma), real-time WebSocket diffing.", td_style)
        ],
        [
            Paragraph("<b>Backend (Server)</b>", td_style_bold),
            Paragraph("Node.js v24, Express.js REST API in TypeScript, JWT auth with bcryptjs, Multer file upload handling, and unified static SPA serving.", td_style),
            Paragraph("Multi-tenant workspace isolation, rate limiting middleware.", td_style)
        ],
        [
            Paragraph("<b>Persistence Layer</b>", td_style_bold),
            Paragraph("SQLite via Prisma ORM (15 relational models). Automated non-destructive schema synchronization and persistent volume support.", td_style),
            Paragraph("PostgreSQL migration via Prisma provider switch for multi-region clustering.", td_style)
        ],
        [
            Paragraph("<b>Compliance Engine</b>", td_style_bold),
            Paragraph("Dual-Layer Provider Adapter: Deterministic Rule Engine (100% offline regex & ground-truth matching) + external LLM adapter fallback.", td_style),
            Paragraph("Automated Vector RAG (pgvector / Pinecone) for multi-thousand page guidelines.", td_style)
        ]
    ]
    arch_table = Table(arch_data, colWidths=[110, 253, 160])
    arch_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(arch_table)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 6: TECHNOLOGY STACK
    # =========================================================================
    story.append(Paragraph("6. Verified Technology Stack", h1_style))
    tech_data = [
        [Paragraph("<b>Category</b>", th_style), Paragraph("<b>Technology</b>", th_style), Paragraph("<b>Exact Role in Implementation</b>", th_style)],
        [Paragraph("Frontend Framework", td_style_bold), Paragraph("React 18.3 + TypeScript 5.6", td_style), Paragraph("Component-driven reactive UI, type-safe review states, diffing viewer.", td_style)],
        [Paragraph("Bundler & Build Tool", td_style_bold), Paragraph("Vite 5.4", td_style), Paragraph("Sub-second HMR development and optimized production asset minification.", td_style)],
        [Paragraph("Styling Engine", td_style_bold), Paragraph("Tailwind CSS 3.4", td_style), Paragraph("Enterprise dark SaaS palette (#080B14 canvas, #0D1220 sidebar, #111827 cards).", td_style)],
        [Paragraph("Telemetry & Charts", td_style_bold), Paragraph("Recharts 2.15", td_style), Paragraph("Dynamic SVG charts for compliance distribution, scores, and review volumes.", td_style)],
        [Paragraph("Backend Framework", td_style_bold), Paragraph("Node.js 24 + Express 4.21", td_style), Paragraph("REST API routing, middleware pipeline, and non-blocking document extraction.", td_style)],
        [Paragraph("Database & ORM", td_style_bold), Paragraph("SQLite + Prisma ORM 5.22", td_style), Paragraph("15 relational models with auto-generated type-safe client.", td_style)],
        [Paragraph("Authentication", td_style_bold), Paragraph("JWT + bcryptjs 2.4", td_style), Paragraph("Stateless token auth, role authorization, and production secret length guards.", td_style)],
        [Paragraph("Document Extractors", td_style_bold), Paragraph("pdf-parse 1.1 + mammoth 1.8", td_style), Paragraph("Server-side buffer extraction for PDF and DOCX uploads without binary execution.", td_style)],
        [Paragraph("Testing Framework", td_style_bold), Paragraph("Jest 29.7 + ts-jest", td_style), Paragraph("Automated unit and integration testing of rule evaluation and approval gates.", td_style)],
        [Paragraph("Deployment Config", td_style_bold), Paragraph("Docker + docker-compose", td_style), Paragraph("Multi-stage container building Vite frontend and running unified Express server.", td_style)]
    ]
    tech_table = Table(tech_data, colWidths=[105, 145, 273])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(tech_table)

    # =========================================================================
    # SECTION 7: IMPLEMENTED FEATURES
    # =========================================================================
    story.append(Paragraph("7. Implemented Features (Verified in Codebase)", h1_style))
    story.append(Paragraph(
        "All features listed below are fully implemented in the codebase and verified through automated tests and database persistence:",
        body_style
    ))
    story.append(Paragraph("&bull; <b>Authentication & 4 User Roles:</b> JWT-based auth with Creator, Reviewer, Brand Manager, and Admin roles. Includes 1-click evaluation persona switching in the header and login screen.", bullet_style))
    story.append(Paragraph("&bull; <b>Multi-Format Content Submission:</b> Ingestion of raw text copy, Markdown, TXT, PDF (`pdf-parse`), DOCX (`mammoth`), and image attachments (`multer`) across 6 publication channels.", bullet_style))
    story.append(Paragraph("&bull; <b>Evidence-Linked Review Workspace:</b> Side-by-side comparison screen highlighting problematic excerpts on the left and presenting verified replacement cards on the right.", bullet_style))
    story.append(Paragraph("&bull; <b>Immutable Draft Versioning (v1 &rarr; v2):</b> Applying suggestions generates a new draft version, preserves change diffs, and recalculates compliance scores without overwriting original drafts.", bullet_style))
    story.append(Paragraph("&bull; <b>Segregation-of-Duties Approval Gates:</b> Creators are strictly prohibited by backend authorization from approving their own reviews. Reviewers sign off with recorded notes.", bullet_style))
    story.append(Paragraph("&bull; <b>Brand Guidelines & Approved Facts Hub:</b> Complete CRUD management for brand tone, forbidden terminology, product nomenclature, and verified company facts.", bullet_style))
    story.append(Paragraph("&bull; <b>Continuous Governance Analytics:</b> Live Recharts dashboard displaying violation distributions, recurring terminology errors, and turnaround velocity.", bullet_style))
    story.append(Paragraph("&bull; <b>NovaTech Seed Workspace:</b> Pre-configured demo dataset with 8 active brand guidelines, 5 approved facts, and seeded review records.", bullet_style))

    # =========================================================================
    # SECTION 8: 8-DIMENSIONAL COMPLIANCE ENGINE
    # =========================================================================
    story.append(Paragraph("8. Eight-Dimensional Compliance Engine", h1_style))
    story.append(Paragraph(
        "<i>Transparency Disclosure:</i> The compliance engine uses our <b>Deterministic Rule Engine</b> (active by default, 100% offline). Checks are executed deterministically against active database guidelines and approved sources using regex word boundaries, negative phrase registries, and source cross-referencing:",
        body_style
    ))

    dim_data = [
        [Paragraph("<b>Inspection Category</b>", th_style), Paragraph("<b>Implemented Evaluation Logic</b>", th_style), Paragraph("<b>Enforced Standard</b>", th_style)],
        [Paragraph("1. Brand Voice", td_style_bold), Paragraph("Scans for unapproved informal slang ('insane speed', 'mind-blowing synergy') against tone guidelines.", td_style), Paragraph("Helpful, Professional & Confident tone", td_style)],
        [Paragraph("2. Terminology", td_style_bold), Paragraph("Case-boundary detection of misspelled product marks ('Nova Tech Pulse', 'novatech pulse').", td_style), Paragraph("Approved capitalization: 'NovaTech Pulse'", td_style)],
        [Paragraph("3. Factual Accuracy", td_style_bold), Paragraph("Cross-references pricing statements against active source records ($12/user annual vs. $10/user).", td_style), Paragraph("Authoritative Ground-Truth pricing", td_style)],
        [Paragraph("4. Promotional Claims", td_style_bold), Paragraph("Detects unaudited superlatives ('world\\'s number one') and absolute guarantees ('100% guarantee').", td_style), Paragraph("G2 Winter 2026 report (#2 market rank)", td_style)],
        [Paragraph("5. Brand Messaging", td_style_bold), Paragraph("Detects missing mandatory promotional disclaimer on advertisements.", td_style), Paragraph("'Features may vary by subscription plan'", td_style)],
        [Paragraph("6. Visual Compliance", td_style_bold), Paragraph("Inspects uploaded file format, encoding (vector/lossless PNG), and minimum dimensions.", td_style), Paragraph("Clear space & lossless format rules", td_style)],
        [Paragraph("7. Accessibility", td_style_bold), Paragraph("Analyzes sentence word counts and flags compound sentences exceeding 35 words.", td_style), Paragraph("Cognitive readability thresholds", td_style)],
        [Paragraph("8. Confidentiality", td_style_bold), Paragraph("Scans regex patterns for live API tokens (sk_live_*), staging URLs, and internal codenames.", td_style), Paragraph("Data leak & token exposure prevention", td_style)]
    ]
    dim_table = Table(dim_data, colWidths=[105, 263, 155])
    dim_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 2.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(dim_table)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 9: END-TO-END WORKFLOW & VERIFIED TEST CASE
    # =========================================================================
    story.append(Paragraph("9. End-to-End Workflow & Verified Test Scenario", h1_style))
    story.append(Paragraph(
        "The complete content governance lifecycle was verified in code through an automated end-to-end integration test:",
        body_style
    ))

    flow_data = [
        [Paragraph("<b>Stage</b>", th_style), Paragraph("<b>Observed System Behavior in E2E Verification</b>", th_style), Paragraph("<b>Score / State</b>", th_style)],
        [
            Paragraph("<b>1. Submission</b>", td_style_bold),
            Paragraph("Creator submits test copy: <i>'Introducing Nova Tech Pulse - the world\\'s number one productivity platform! Our synergy guarantees zero missed deadlines. Pricing is only $10/user. Sign up now!'</i>", td_style),
            Paragraph("Status: <b>SUBMITTED</b><br/>Score: <b>5%</b> (5 critical/high flags)", td_style)
        ],
        [
            Paragraph("<b>2. AI Findings</b>", td_style_bold),
            Paragraph("Engine identifies: (1) Brand spelling violation ('Nova Tech' &rarr; 'NovaTech'), (2) Unaudited superlative ('world\\'s #1'), (3) Absolute guarantee ('100% guarantee'), (4) Pricing discrepancy ($10 vs. $12), and (5) Missing disclaimer.", td_style),
            Paragraph("5 Evidence-linked cards generated with citations.", td_style)
        ],
        [
            Paragraph("<b>3. Human Revision</b>", td_style_bold),
            Paragraph("Creator applies recommended corrections into working draft. System creates immutable Version 2 (v1 &rarr; v2) with change summary diffs.", td_style),
            Paragraph("Status: <b>REVISED</b><br/>Score: <b>100%</b> (0 flags remaining)", td_style)
        ],
        [
            Paragraph("<b>4. Segregation Gate</b>", td_style_bold),
            Paragraph("Creator attempts self-approval. System throws 403 Forbidden: <i>'Policy Violation: Creators are strictly prohibited from approving their own submissions.'</i>", td_style),
            Paragraph("Self-approval blocked by backend.", td_style)
        ],
        [
            Paragraph("<b>5. Final Approval</b>", td_style_bold),
            Paragraph("Persona switched to Marcus Sterling (Senior Reviewer). Reviewer inspects compliance score (100%), adds approval notes, and signs off.", td_style),
            Paragraph("Status: <b>APPROVED</b><br/>Permanently logged in audit trail.", td_style)
        ]
    ]
    flow_table = Table(flow_data, colWidths=[90, 313, 120])
    flow_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3.5),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3.5),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(flow_table)
    story.append(Spacer(1, 4))
    story.append(Paragraph(
        "<font color='#64748b' size='7.5'><i>* Note: The 5% &rarr; 100% score transition represents this specific automated test scenario demonstrating complete violation resolution. Scores on arbitrary user copy will reflect the exact severity-weighted formula.</i></font>",
        body_style
    ))

    # =========================================================================
    # SECTION 10: SECURITY AND AUTHORIZATION
    # =========================================================================
    story.append(Paragraph("10. Security & Authorization Architecture", h1_style))
    story.append(Paragraph("&bull; <b>JWT Token Security:</b> Signed with HS256 algorithm. Production middleware strictly requires `JWT_SECRET` to be explicitly configured and at least 16 characters long; fails fast with fatal errors on startup if unset.", bullet_style))
    story.append(Paragraph("&bull; <b>Password Hashing:</b> Passwords hashed using `bcryptjs` with salt rounds = 10. Raw credentials are never stored or exposed.", bullet_style))
    story.append(Paragraph("&bull; <b>Role-Based Access Control (RBAC):</b> Server-side authorization middleware (`requireAuth`, `requireRole`) guards guidelines, approved facts, and approval decision endpoints.", bullet_style))
    story.append(Paragraph("&bull; <b>No Secrets in Version Control:</b> `.env` files, `.pem` keys, and database `.db` files are strictly excluded from Git via `.gitignore`.", bullet_style))

    # =========================================================================
    # SECTION 11: TESTING AND VERIFICATION
    # =========================================================================
    story.append(Paragraph("11. Testing & Build Verification Evidence", h1_style))
    story.append(Paragraph(
        "All test runs and builds were physically executed and verified in the development environment:",
        body_style
    ))

    test_summary_data = [
        [Paragraph("<b>Verification Target</b>", th_style), Paragraph("<b>Command Executed</b>", th_style), Paragraph("<b>Actual Outcome</b>", th_style)],
        [Paragraph("Backend TypeScript Build", td_style_bold), Paragraph("cd server && npm run build", td_style), Paragraph("<b>PASSED (Exit Code: 0)</b>. Zero compiler errors.", td_style)],
        [Paragraph("Frontend Production Build", td_style_bold), Paragraph("cd client && npm run build", td_style), Paragraph("<b>PASSED (Exit Code: 0)</b> in 6.23s. Bundles minified.", td_style)],
        [Paragraph("Automated Test Suite", td_style_bold), Paragraph("cd server && npm test", td_style), Paragraph("<b>PASSED (Exit Code: 0)</b>. 2 test suites, 6/6 tests passing.", td_style)],
        [Paragraph("Compliance Rule Evaluation", td_style_bold), Paragraph("Jest: compliance.test.ts", td_style), Paragraph("<b>PASSED</b>. Validated naming, superlatives, and scoring.", td_style)],
        [Paragraph("Approval Authorization Gates", td_style_bold), Paragraph("Jest: approval.test.ts", td_style), Paragraph("<b>PASSED</b>. Verified creator self-approval prohibition.", td_style)],
        [Paragraph("Docker Build Verification", td_style_bold), Paragraph("docker --version", td_style), Paragraph("<b>LIMITATION NOTED</b>: Docker CLI not installed on host.", td_style)]
    ]
    test_table = Table(test_summary_data, colWidths=[120, 160, 243])
    test_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(test_table)

    story.append(PageBreak())

    # =========================================================================
    # SECTION 12: CHANGES FROM ROUND 1
    # =========================================================================
    story.append(Paragraph("12. Changes from Round 1 Proposal to Round 2 Implementation", h1_style))
    diff_data = [
        [Paragraph("<b>Proposal Component</b>", th_style), Paragraph("<b>Round 1 Architectural Plan</b>", th_style), Paragraph("<b>Round 2 Actual Implementation Status</b>", th_style)],
        [
            Paragraph("Review Engine Core", td_style_bold),
            Paragraph("Planned 8-category evaluation pipeline.", td_style),
            Paragraph("<b>COMPLETED</b>: Fully functional deterministic rule engine evaluating all 8 dimensions with evidence citations.", td_style)
        ],
        [
            Paragraph("Revision Workspace", td_style_bold),
            Paragraph("Side-by-side diff editor with 1-click fixes.", td_style),
            Paragraph("<b>COMPLETED</b>: Interactive split-screen editor with single & batch correction application and draft versioning.", td_style)
        ],
        [
            Paragraph("Approval Segregation", td_style_bold),
            Paragraph("Role-based approval controls.", td_style),
            Paragraph("<b>COMPLETED</b>: Backend-enforced prohibition on creator self-approval and critical issue gates.", td_style)
        ],
        [
            Paragraph("Unified Serving", td_style_bold),
            Paragraph("Separate client and server hosts.", td_style),
            Paragraph("<b>ENHANCED</b>: Backend serves compiled Vite frontend directly from single port (5000) with SPA fallback.", td_style)
        ],
        [
            Paragraph("Browser Extensions", td_style_bold),
            Paragraph("Google Docs and Figma plugins.", td_style),
            Paragraph("<b>DEFERRED TO ROUND 3</b>: Outside MVP scope; designated for post-hackathon scaling.", td_style)
        ],
        [
            Paragraph("Vector RAG", td_style_bold),
            Paragraph("Semantic vector retrieval on stylebooks.", td_style),
            Paragraph("<b>DEFERRED TO ROUND 3</b>: Current deterministic ground-truth matching provides faster, zero-latency citations.", td_style)
        ]
    ]
    diff_table = Table(diff_data, colWidths=[110, 180, 233])
    diff_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(diff_table)

    # =========================================================================
    # SECTION 13: KNOWN LIMITATIONS
    # =========================================================================
    story.append(Paragraph("13. Known Limitations & Production Dependencies", h1_style))
    story.append(Paragraph("&bull; <b>Local Host Docker Limitation:</b> Docker engine was not installed in the Windows evaluation environment. Container deployment was validated through configuration review (`Dockerfile`, `docker-compose.yml`) and push to Render.", bullet_style))
    story.append(Paragraph("&bull; <b>Persistent Cloud Storage Dependency:</b> SQLite is ideal for zero-config evaluation. When deploying on serverless clouds (e.g. Vercel), ephemeral filesystems lose data. Platforms with persistent disks (Render, Railway) or migration to PostgreSQL are required.", bullet_style))
    story.append(Paragraph("&bull; <b>Semantic Logo Recognition:</b> Image analysis validates file dimensions, encoding formats, and declared palettes. Deep visual logo placement verification requires vision model enablement or human sign-off.", bullet_style))
    story.append(Paragraph("&bull; <b>Live Public URL Status:</b> Cloud deployment was initiated on Render from commit `890024a`. Final public availability depends on cloud instance provisioning.", bullet_style))

    # =========================================================================
    # SECTION 14: ROUND 3 COMMITMENTS
    # =========================================================================
    story.append(Paragraph("14. Round 3 Improvement Commitments <font size=7 color='#64748b'>(Planned for Round 3)</font>", h1_style))
    story.append(Paragraph(
        "To advance BrandGuard AI from a production MVP to an enterprise-wide governance platform, the following three key capabilities are scheduled for implementation in Round 3:",
        body_style
    ))
    story.append(Paragraph("<b>A. Browser Extension for Authoring Environments (Planned):</b> A lightweight Chrome/Edge extension that brings real-time BrandGuard AI compliance checking directly inside Google Docs, Notion, and Figma, alerting writers to non-compliant terminology before content is exported.", bullet_style))
    story.append(Paragraph("<b>B. Retrieval-Augmented Generation (RAG) Grounding (Planned):</b> A vector pipeline integrating `pgvector` or Pinecone to chunk and embed multi-thousand page enterprise brand books, enabling semantic guideline lookup for complex tonal questions.", bullet_style))
    story.append(Paragraph("<b>C. CMS Pre-Publication Webhook Gate (Planned):</b> Direct webhook integrations for WordPress, HubSpot, and Hootsuite that automatically inspect scheduled marketing campaigns and block publication if critical compliance issues exist.", bullet_style))

    # =========================================================================
    # SECTION 15: CONCLUSION & SECTION 16: APPENDIX
    # =========================================================================
    story.append(Paragraph("15. Conclusion & 16. Appendix", h1_style))
    story.append(Paragraph(
        "BrandGuard AI successfully fulfills the CodeStar 30 Round 2 requirements by delivering a functional, tested, and reliable content governance MVP. It replaces subjective manual reviews with an objective, evidence-linked compliance engine while preserving human editorial authority.",
        body_style
    ))

    appendix_data = [
        [Paragraph("<b>Resource / Setting</b>", th_style), Paragraph("<b>Value / Specification</b>", th_style)],
        [Paragraph("GitHub Repository", td_style_bold), Paragraph("https://github.com/mohul-inventions/brandguard-ai", td_style)],
        [Paragraph("Lead Developer", td_style_bold), Paragraph("C. R. Mohul Ram (mohulram07@gmail.com | Amrita Vishwa Vidyapeetham)", td_style)],
        [Paragraph("Local Development URLs", td_style_bold), Paragraph("Unified: http://localhost:5000 | Client Dev: http://localhost:5173", td_style)],
        [Paragraph("Target Cloud Platform", td_style_bold), Paragraph("Render Web Service (Docker container deployment with persistent disk)", td_style)],
        [Paragraph("Required Env Configs", td_style_bold), Paragraph("PORT, NODE_ENV, DATABASE_URL, JWT_SECRET, CLIENT_ORIGIN, AI_PROVIDER", td_style)],
        [Paragraph("Test Execution Result", td_style_bold), Paragraph("2 Test Suites Passed, 6/6 Unit & Integration Tests Passing (100%)", td_style)]
    ]
    app_table = Table(appendix_data, colWidths=[140, 383])
    app_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), c_navy),
        ('GRID', (0,0), (-1,-1), 0.5, c_border),
        ('ROWBACKGROUNDS', (0,1), (-1,-1), [colors.white, c_card_bg]),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LEFTPADDING', (0,0), (-1,-1), 6),
        ('RIGHTPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(app_table)

    # Build the PDF
    doc.build(story, canvasmaker=NumberedCanvas)
    print(f"SUCCESS: Generated PDF report at {filename}")

def build_docx(filename):
    doc = docx.Document()

    # Page Margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.5)
        section.bottom_margin = Inches(0.5)
        section.left_margin = Inches(0.5)
        section.right_margin = Inches(0.5)

    # Title
    p_title = doc.add_paragraph()
    p_title.paragraph_format.space_after = Pt(2)
    run_badge = p_title.add_run("CODESTAR 30 HACKATHON | ROUND 2 FINAL PROJECT REPORT\n")
    run_badge.font.size = Pt(9)
    run_badge.font.bold = True
    run_badge.font.color.rgb = RGBColor(79, 70, 229)

    run_title = p_title.add_run("BRANDGUARD AI 🛡️\n")
    run_title.font.size = Pt(22)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(15, 23, 42)

    run_sub = p_title.add_run("Intelligent Brand Governance & Content Compliance Platform\n")
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(71, 85, 105)

    # Metadata Table
    table = doc.add_table(rows=2, cols=4)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.autofit = True

    meta = [
        [("EVENT", "CodeStar 30 — Round 2"), ("CHALLENGE", "Inkloom AI"), ("AUTHOR", "C. R. Mohul Ram"), ("DEGREE", "B.Tech CSE")],
        [("INSTITUTION", "Amrita Vishwa Vidyapeetham"), ("CAMPUS", "Nagercoil Campus"), ("GITHUB", "mohul-inventions/brandguard-ai"), ("TESTS", "6/6 Passing")]
    ]

    for r_idx, row in enumerate(meta):
        for c_idx, (k, v) in enumerate(row):
            cell = table.cell(r_idx, c_idx)
            cell.text = f"{k}: {v}"
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2)
                for run in p.runs:
                    run.font.size = Pt(8)

    doc.add_paragraph()

    # Sections helper
    def add_sec(title):
        h = doc.add_paragraph()
        h.paragraph_format.space_before = Pt(10)
        h.paragraph_format.space_after = Pt(3)
        r = h.add_run(title)
        r.font.size = Pt(12)
        r.font.bold = True
        r.font.color.rgb = RGBColor(79, 70, 229)

    def add_p(text):
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(4)
        r = p.add_run(text)
        r.font.size = Pt(9.5)

    add_sec("2. Executive Summary")
    add_p("BrandGuard AI is an intelligent brand governance platform that inspects digital marketing copy against approved brand guidelines, voice rules, and ground-truth corporate sources prior to publication. It combines an automated 8-dimensional compliance engine with a human-in-the-loop revision workspace where creators review evidence-linked findings, apply fixes into versioned drafts (v1 -> v2), and route content through strict role-segregated approval workflows.")

    add_sec("3. Problem Statement & Root Failures")
    add_p("• Inconsistent Brand Voice: Uncontrolled divergence between casual slang, jargon, and corporate brand personality guidelines.")
    add_p("• Unsupported Claims & Outdated Facts: Authors make exaggerated marketing claims or cite outdated pricing statements that contradict corporate source records.")
    add_p("• Incorrect Terminology & Missing Disclaimers: Misspelled product marks and omitted statutory disclaimers that create legal liability.")
    add_p("• Accessibility & Confidentiality Risks: Sentences exceeding cognitive readability thresholds and inadvertent exposure of internal project codenames or tokens.")

    add_sec("4. Proposed Solution")
    add_p("BrandGuard AI provides an evidence-linked governance pipeline. For every finding, it explains: (1) What is wrong, (2) Why it matters, (3) Supporting guideline or source citation, (4) Severity level, (5) Confidence score, and (6) Suggested replacement. Critically, unsupported claims are categorized as Unverified rather than falsely assumed false.")

    add_sec("5. System Architecture")
    add_p("• Frontend: React 18, Vite 5, TypeScript 5, Tailwind CSS, Recharts telemetry, React Router v6.")
    add_p("• Backend: Node.js 24, Express.js REST API in TypeScript, JWT auth with bcryptjs, and Multer file upload handling.")
    add_p("• Persistence: SQLite via Prisma ORM (15 relational models) with non-destructive seeding and persistent volume support.")
    add_p("• Compliance Engine: Dual-Layer Provider Adapter supporting Deterministic Rule Engine (default, 100% offline) and external LLM fallback.")

    add_sec("6. Verified Technology Stack")
    add_p("React 18.3, Vite 5.4, TypeScript 5.6, Tailwind CSS 3.4, Recharts 2.15, Node.js 24, Express 4.21, Prisma 5.22, SQLite, JWT, bcryptjs, pdf-parse, mammoth, Jest 29.7, ts-jest, Docker.")

    add_sec("7. Implemented Features")
    add_p("• Authentication & 4 User Roles: Creator, Reviewer, Brand Manager, Admin.")
    add_p("• Multi-Format Content Ingestion: Raw text, Markdown, TXT, PDF, DOCX, and images.")
    add_p("• Side-by-Side Revision Workspace: Real-time text highlighting and 1-click suggestion replacements.")
    add_p("• Immutable Version History: v1 -> v2 version increments preserving change diffs.")
    add_p("• Segregation-of-Duties Approval Gates: Creators cannot self-approve submissions.")
    add_p("• Brand Guidelines & Approved Facts Hub: Centralized rule and ground-truth repository.")
    add_p("• Governance Analytics Dashboard: Live Recharts telemetry tracking violation distributions.")

    add_sec("8. Eight-Dimensional Compliance Engine")
    add_p("Evaluates content across 8 distinct categories using deterministic regex boundaries, negative phrase registries, and source lookups: Brand Voice, Terminology, Factual Accuracy, Promotional Claims, Brand Messaging, Visual Compliance, Accessibility, and Confidentiality.")

    add_sec("9. End-to-End Workflow & Verified Test Scenario")
    add_p("The complete lifecycle was validated via an automated end-to-end integration test: (1) Test review submitted with intentional violations (Initial Score: 5%, 5 critical/high findings); (2) Creator applies approved fixes into Version 2 (New Score: 100%, 0 findings); (3) Creator self-approval is rejected by backend; (4) Persona switched to Reviewer who grants formal publication sign-off.")

    add_sec("10. Security & Authorization Architecture")
    add_p("Stateless JWT authentication (HS256) with production secret length validation (>=16 chars), bcrypt password hashing (salt rounds = 10), server-side role middleware, and zero secrets committed to Git.")

    add_sec("11. Testing & Build Verification Evidence")
    add_p("• Backend Build: PASSED (Exit Code: 0) with zero TypeScript errors.")
    add_p("• Frontend Build: PASSED (Exit Code: 0) in 6.23s via Vite.")
    add_p("• Automated Test Suite: PASSED (Exit Code: 0) with 6/6 tests passing in Jest.")
    add_p("• Docker Limitation Noted: Docker CLI was not installed on local host machine; deployment manifests validated via static analysis.")

    add_sec("12. Changes from Round 1 Proposal")
    add_p("Completed: Core review engine across all 8 dimensions, side-by-side revision workspace, version control, and approval workflow. Enhanced: Single-port full-stack serving. Deferred to Round 3: Browser extensions and Vector RAG.")

    add_sec("13. Known Limitations")
    add_p("• Docker CLI limitation in local host environment.")
    add_p("• SQLite requires persistent disk storage or PostgreSQL migration for serverless platforms.")
    add_p("• Visual logo placement checking requires human sign-off beyond local dimension/encoding checks.")
    add_p("• Cloud deployment on Render initiated from commit 890024a.")

    add_sec("14. Round 3 Improvement Commitments")
    add_p("A. Browser Extension for Authoring Environments (Planned): Real-time checking in Google Docs, Notion, and Figma.")
    add_p("B. Retrieval-Augmented Generation (RAG) Grounding (Planned): Vector embeddings for multi-thousand page corporate stylebooks.")
    add_p("C. CMS Pre-Publication Webhook Gate (Planned): Pre-publication validation for WordPress and HubSpot.")

    add_sec("15. Conclusion & 16. Appendix")
    add_p("BrandGuard AI delivers a robust, tested, and reliable content governance MVP for CodeStar 30 Round 2.")
    add_p("Repository: https://github.com/mohul-inventions/brandguard-ai")
    add_p("Author: C. R. Mohul Ram (mohulram07@gmail.com | Amrita Vishwa Vidyapeetham)")

    doc.save(filename)
    print(f"SUCCESS: Generated DOCX report at {filename}")

if __name__ == "__main__":
    pdf_out = "C:/Users/mohul/.gemini/antigravity/scratch/brandguard-ai/BrandGuard_AI_CodeStar30_Round2_Report.pdf"
    docx_out = "C:/Users/mohul/.gemini/antigravity/scratch/brandguard-ai/BrandGuard_AI_CodeStar30_Round2_Report.docx"
    build_pdf(pdf_out)
    build_docx(docx_out)
