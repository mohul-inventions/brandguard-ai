import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding BrandGuard AI database with NovaTech demo workspace...');

  // Clean existing data for idempotency
  await prisma.notification.deleteMany();
  await prisma.auditEvent.deleteMany();
  await prisma.approvalDecision.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.suggestedCorrection.deleteMany();
  await prisma.finding.deleteMany();
  await prisma.contentVersion.deleteMany();
  await prisma.contentReview.deleteMany();
  await prisma.brandAsset.deleteMany();
  await prisma.approvedSource.deleteMany();
  await prisma.guidelineVersion.deleteMany();
  await prisma.brandGuideline.deleteMany();
  await prisma.workspaceMembership.deleteMany();
  await prisma.workspace.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. Create Demo Users
  const creator = await prisma.user.create({
    data: {
      email: 'creator@novatech.io',
      passwordHash,
      name: 'Alex Rivera',
      role: 'CREATOR',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@novatech.io',
      passwordHash,
      name: 'Elena Vance',
      role: 'BRAND_MANAGER',
      avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    },
  });

  const reviewer = await prisma.user.create({
    data: {
      email: 'reviewer@novatech.io',
      passwordHash,
      name: 'Marcus Sterling',
      role: 'REVIEWER',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    },
  });

  const admin = await prisma.user.create({
    data: {
      email: 'admin@novatech.io',
      passwordHash,
      name: 'Sarah Chen',
      role: 'ADMIN',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    },
  });

  // 2. Create Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: 'NovaTech Global',
      slug: 'novatech',
      description: 'Official corporate workspace for NovaTech Pulse productivity suite governance.',
    },
  });

  // Workspace Memberships
  await prisma.workspaceMembership.createMany({
    data: [
      { userId: creator.id, workspaceId: workspace.id, role: 'CREATOR' },
      { userId: manager.id, workspaceId: workspace.id, role: 'BRAND_MANAGER' },
      { userId: reviewer.id, workspaceId: workspace.id, role: 'REVIEWER' },
      { userId: admin.id, workspaceId: workspace.id, role: 'ADMIN' },
    ],
  });

  // 3. Create Brand Guidelines (all 8 categories represented)
  const g1 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Official Product Naming & Spelling',
      category: 'TERMINOLOGY',
      severity: 'CRITICAL',
      description: 'Our flagship productivity platform must always be written with exact casing as "NovaTech Pulse".',
      ruleDetails: 'Never split into "Nova Tech", or omit the brand name like "Pulse AI" or "NovaPulse". Always use camelCase NovaTech followed by single space Pulse.',
      examplesToAvoid: JSON.stringify(['Nova Tech Pulse', 'Pulse AI', 'NovaPulse', 'novatech pulse', 'Nova-Tech']),
      preferredReplacements: JSON.stringify({
        'Nova Tech': 'NovaTech',
        'Pulse AI': 'NovaTech Pulse',
        'NovaPulse': 'NovaTech Pulse',
        'novatech pulse': 'NovaTech Pulse',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g2 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Prohibition of Unaudited Superlatives & Absolute Guarantees',
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'CRITICAL',
      description: 'Never make unverifiable claims such as "the world\'s #1 productivity tool" or "100% guaranteed zero downtime".',
      ruleDetails: 'All superlative claims must cite a third-party verified benchmark (Gartner, Forrester, or G2 Leader Badge 2026). Unverified superlatives create severe regulatory and brand risk.',
      examplesToAvoid: JSON.stringify([
        "the world's number one productivity platform",
        "world's #1",
        "100% guarantee",
        "unbeatable efficiency",
        "flawless without question",
      ]),
      preferredReplacements: JSON.stringify({
        "world's number one": "industry-leading",
        "the world's number one productivity platform": "a high-performance productivity platform for distributed teams",
        "100% guarantee": "designed for high enterprise reliability",
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g3 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Tone of Voice: Helpful, Professional & Confident',
      category: 'BRAND_VOICE',
      severity: 'HIGH',
      description: 'NovaTech communications should empower modern distributed teams with clarity and empathy.',
      ruleDetails: 'Avoid excessive hype, empty corporate jargon, and overly casual slang. Write in active voice. Avoid phrases like "mind-blowing synergy", "insane speed", or "cheap hacks".',
      examplesToAvoid: JSON.stringify(['insane speed', 'mind-blowing synergy', 'cheap hacks', 'super chill', 'literally crazy']),
      preferredReplacements: JSON.stringify({
        'insane speed': 'rapid execution',
        'mind-blowing synergy': 'seamless cross-functional collaboration',
        'cheap hacks': 'smart workflows',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g4 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Mandatory Subscription Plan Disclaimer in Advertisements',
      category: 'BRAND_MESSAGING',
      severity: 'HIGH',
      description: 'Any marketing or advertising copy promoting Pro/Enterprise features must include the mandatory disclaimer.',
      ruleDetails: 'Legal requires all public ad campaigns to state: "Features may vary by subscription plan." Missing this disclaimer exposes NovaTech to deceptive advertising complaints.',
      examplesToAvoid: JSON.stringify(['Promotional copy without plan disclaimer']),
      preferredReplacements: JSON.stringify({
        '[missing disclaimer]': 'Features may vary by subscription plan.',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g5 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Accurate Pricing Statements for Pro Tier',
      category: 'FACTUAL_ACCURACY',
      severity: 'HIGH',
      description: 'All public statements regarding pricing must match our current approved pricing schedule.',
      ruleDetails: 'NovaTech Pulse Pro is priced at $12/user/month (billed annually) or $15/user/month (billed monthly). Outdated references to $10 or unverified discounts are strictly forbidden.',
      examplesToAvoid: JSON.stringify(['$10/user', '$9 per month', 'completely free forever with no limits']),
      preferredReplacements: JSON.stringify({
        '$10/user': '$12/user/month',
        '$9 per month': '$12/user/month (billed annually)',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g6 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Accessibility: Plain Language & Plain Text Contrast',
      category: 'ACCESSIBILITY',
      severity: 'MEDIUM',
      description: 'Keep copy readable and accessible. Sentences should not exceed 35 words.',
      ruleDetails: 'Define all acronyms on initial mention (e.g., "Single Sign-On (SSO)"). Provide meaningful alternative text descriptions for all promotional visuals and infographics.',
      examplesToAvoid: JSON.stringify(['Sentences > 35 words', 'Undefined technical acronyms without explanation']),
      preferredReplacements: JSON.stringify({
        'SSO': 'Single Sign-On (SSO)',
        'MFA': 'Multi-Factor Authentication (MFA)',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g7 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Visual Identity: Logo Clear Space & Color Contrast',
      category: 'VISUAL_COMPLIANCE',
      severity: 'MEDIUM',
      description: 'All digital assets must use approved brand palettes (#080B14 Dark Canvas, #8B5CF6 Electric Violet, #06B6D4 Cyan).',
      ruleDetails: 'The NovaTech Pulse primary logo requires 24px padding on all sides. Do not place logo on unapproved high-saturation neon backgrounds.',
      examplesToAvoid: JSON.stringify(['Distorted logo aspect ratio', 'Neon yellow backgrounds', 'Insufficient text-to-background contrast']),
      preferredReplacements: JSON.stringify({}),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  const g8 = await prisma.brandGuideline.create({
    data: {
      workspaceId: workspace.id,
      title: 'Confidentiality & Internal Sensitive Data Protection',
      category: 'CONFIDENTIALITY',
      severity: 'CRITICAL',
      description: 'Never disclose internal code names, unreleased feature roadmaps, or API keys in public content.',
      ruleDetails: 'Code names "Project Hyperion" and "Project Titan" are strictly confidential until Q1 2027. Internal staging URLs (*.staging.internal.novatech.io) must never be published.',
      examplesToAvoid: JSON.stringify(['Project Hyperion', 'Project Titan', 'staging.internal.novatech.io', 'sk_live_']),
      preferredReplacements: JSON.stringify({
        'Project Hyperion': '[Redacted Internal Project]',
        'Project Titan': '[Redacted Internal Project]',
      }),
      isActive: true,
      version: 1,
      authorId: manager.id,
    },
  });

  // Guideline Versions
  await prisma.guidelineVersion.create({
    data: {
      guidelineId: g1.id,
      version: 1,
      changeSummary: 'Initial baseline brand naming definition for NovaTech Pulse v3 release.',
      ruleDetails: g1.ruleDetails,
      changedById: manager.id,
    },
  });

  // 4. Create Approved Sources (Authoritative Ground Truth)
  const s1 = await prisma.approvedSource.create({
    data: {
      workspaceId: workspace.id,
      title: 'NovaTech Pulse Official Product Specification (v3.2)',
      sourceType: 'PRODUCT_SPEC',
      content: 'NovaTech Pulse is a productivity and work management platform designed for distributed teams. Core capabilities include real-time task tracking, asynchronous daily standups, automated sprint reporting, and collaborative document boards.',
      referenceUrl: 'https://novatech.io/specs/pulse-v3.2',
      owner: 'Product Architecture Team',
      verificationDate: new Date('2026-01-15'),
      status: 'ACTIVE',
    },
  });

  const s2 = await prisma.approvedSource.create({
    data: {
      workspaceId: workspace.id,
      title: 'NovaTech Global Official Company Facts & Figures',
      sourceType: 'COMPANY_PROFILE',
      content: 'NovaTech Global was founded in 2021 with headquarters in San Francisco, CA. The platform currently serves over 450,000 active remote workers across 82 countries. SOC 2 Type II certified and GDPR compliant.',
      referenceUrl: 'https://novatech.io/about',
      owner: 'Corporate Communications',
      verificationDate: new Date('2026-02-01'),
      status: 'ACTIVE',
    },
  });

  const s3 = await prisma.approvedSource.create({
    data: {
      workspaceId: workspace.id,
      title: 'FY2026 Official Pricing Schedule',
      sourceType: 'PRICING',
      content: 'Starter Tier: $0 (up to 5 members). Pro Tier: $12 per user/month billed annually ($15 billed monthly). Enterprise Tier: Custom pricing starting at 100 seats with 99.99% SLA guarantee and dedicated technical account management.',
      referenceUrl: 'https://novatech.io/pricing',
      owner: 'Finance & Pricing Committee',
      verificationDate: new Date('2026-01-01'),
      status: 'ACTIVE',
    },
  });

  const s4 = await prisma.approvedSource.create({
    data: {
      workspaceId: workspace.id,
      title: 'Legal Disclaimer Standards for Public Marketing',
      sourceType: 'LEGAL_DISCLAIMER',
      content: 'Mandatory legal disclaimer for all promotional advertisements, sponsor banners, and social campaigns: "Features may vary by subscription plan."',
      referenceUrl: 'https://novatech.io/legal/marketing-disclaimers',
      owner: 'Office of General Counsel',
      verificationDate: new Date('2026-01-10'),
      status: 'ACTIVE',
    },
  });

  const s5 = await prisma.approvedSource.create({
    data: {
      workspaceId: workspace.id,
      title: 'G2 Winter 2026 Market Report',
      sourceType: 'STATISTIC',
      content: 'NovaTech Pulse was rated #2 in Remote Collaboration Workspaces with a 4.8/5 user satisfaction score across 1,200 verified customer reviews. (Note: Claiming #1 overall is unsupported as competitor retains higher market presence).',
      referenceUrl: 'https://g2.com/reports/winter-2026-collaboration',
      owner: 'Competitive Intelligence',
      verificationDate: new Date('2026-01-20'),
      status: 'ACTIVE',
    },
  });

  // 5. Create Brand Assets
  await prisma.brandAsset.createMany({
    data: [
      {
        workspaceId: workspace.id,
        name: 'NovaTech Pulse Primary Wordmark (SVG)',
        assetType: 'LOGO',
        fileUrl: '/uploads/assets/novatech-logo-primary.svg',
        description: 'Primary corporate horizontal logo for dark background displays. Requires 24px clear margin padding.',
        usageRestrictions: 'Do not modify color values. Do not place over cluttered photo backgrounds.',
        metadataJson: JSON.stringify({ width: 512, height: 128, format: 'svg', minWidthPx: 120, colors: ['#8B5CF6', '#06B6D4', '#F8FAFC'] }),
        status: 'APPROVED',
      },
      {
        workspaceId: workspace.id,
        name: 'Brand Palette 2026 Design Tokens',
        assetType: 'COLOR_PALETTE',
        fileUrl: null,
        description: 'Approved primary and accent hex codes for all digital product surfaces and marketing materials.',
        usageRestrictions: 'Must maintain WCAG AAA contrast ratio (7:1 for normal text, 4.5:1 for large text).',
        metadataJson: JSON.stringify({
          primary: '#8B5CF6',
          accent: '#06B6D4',
          background: '#080B14',
          card: '#111827',
          success: '#22C55E',
          warning: '#F59E0B',
          error: '#EF4444',
        }),
        status: 'APPROVED',
      },
      {
        workspaceId: workspace.id,
        name: 'NovaTech App Icon (Squircle)',
        assetType: 'ICON',
        fileUrl: '/uploads/assets/novatech-icon.png',
        description: 'Official application icon for desktop, mobile and browser bookmarking.',
        usageRestrictions: 'Maintain 1:1 aspect ratio. Do not stretch or distort.',
        metadataJson: JSON.stringify({ width: 256, height: 256, format: 'png' }),
        status: 'APPROVED',
      },
      {
        workspaceId: workspace.id,
        name: 'Legacy 2024 Circular Logo',
        assetType: 'LOGO',
        fileUrl: '/uploads/assets/legacy-logo.png',
        description: 'Deprecated circular badge used prior to the 2026 rebrand.',
        usageRestrictions: 'RETIRED. Do not use in any new collateral.',
        metadataJson: JSON.stringify({ format: 'png', deprecatedSince: '2025-12-31' }),
        status: 'RETIRED',
      },
    ],
  });

  // 6. Pre-seeded Content Reviews demonstrating the complete workflow

  // Review 1: DEMO HIGHLIGHT - "Q4 Social Campaign - NovaTech Pulse Launch" (In Changes Requested status)
  const review1 = await prisma.contentReview.create({
    data: {
      workspaceId: workspace.id,
      creatorId: creator.id,
      reviewerId: reviewer.id,
      title: 'Q4 Social Campaign - NovaTech Pulse Launch',
      contentType: 'SOCIAL_MEDIA',
      targetAudience: 'Engineering Leaders and Remote Team Managers',
      channel: 'LinkedIn and X (Twitter)',
      status: 'CHANGES_REQUESTED',
      complianceScore: 52,
      criticalCount: 2,
      highCount: 2,
      mediumCount: 1,
      lowCount: 0,
      currentVersionNum: 1,
      notes: 'Initial launch copy drafted by Alex for the upcoming NovaTech Pulse v3.2 release.',
      isDemoRecord: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2), // 2 days ago
    },
  });

  const r1Content = `Introducing Nova Tech Pulse - the world's number one productivity platform! 🚀

Tired of clunky collaboration tools? With our mind-blowing synergy, your team will achieve insane speed and 100% guarantee of zero missed deadlines. 

Upgrade to our Pro tier today for only $10/user and unleash distributed workflow mastery. Sign up now!`;

  await prisma.contentVersion.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      contentBody: r1Content,
      summaryOfChanges: 'Initial submission for brand compliance review',
      createdById: creator.id,
      createdAt: new Date(Date.now() - 3600000 * 24 * 2),
    },
  });

  // Findings for Review 1
  const f1 = await prisma.finding.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      category: 'TERMINOLOGY',
      severity: 'CRITICAL',
      title: 'Incorrect Brand Name Spelling ("Nova Tech")',
      excerpt: 'Introducing Nova Tech Pulse',
      explanation: 'Our company and product brand name is "NovaTech Pulse" with no space between "Nova" and "Tech". Split branding causes brand dilution and inconsistent search indexation.',
      guidelineId: g1.id,
      guidelineRef: 'Official Product Naming & Spelling (v1)',
      evidence: 'Matches forbidden pattern "Nova Tech" defined in brand guideline #1.',
      confidence: 0.99,
      suggestedCorrection: 'Introducing NovaTech Pulse',
      status: 'OPEN',
      isUnverified: false,
    },
  });

  await prisma.suggestedCorrection.create({
    data: {
      findingId: f1.id,
      originalText: 'Nova Tech Pulse',
      proposedReplacement: 'NovaTech Pulse',
      reasoning: 'Matches official camelCase brand guidelines.',
    },
  });

  const f2 = await prisma.finding.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'CRITICAL',
      title: 'Unsupported Superlative Claim ("world\'s number one")',
      excerpt: "the world's number one productivity platform",
      explanation: 'Making absolute superlative claims without third-party audit verification violates FTC advertising regulations and NovaTech compliance guidelines. Independent market reports rate NovaTech #2 in category.',
      guidelineId: g2.id,
      guidelineRef: 'Prohibition of Unaudited Superlatives & Absolute Guarantees',
      sourceId: s5.id,
      sourceRef: 'G2 Winter 2026 Market Report',
      evidence: 'G2 Winter 2026 report verifies NovaTech at #2, not #1. Claim is factually unsupported.',
      confidence: 0.95,
      suggestedCorrection: 'an industry-leading productivity platform for distributed teams',
      status: 'OPEN',
      isUnverified: false,
    },
  });

  await prisma.suggestedCorrection.create({
    data: {
      findingId: f2.id,
      originalText: "the world's number one productivity platform",
      proposedReplacement: 'an industry-leading productivity platform for distributed teams',
      reasoning: 'Replaces unsubstantiated absolute claim with verified descriptive positioning.',
    },
  });

  const f3 = await prisma.finding.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'HIGH',
      title: 'Unpermitted Absolute Guarantee ("100% guarantee")',
      excerpt: '100% guarantee of zero missed deadlines',
      explanation: 'Absolute guarantees of customer project success are legally indefensible and prohibited by our promotional claims policy.',
      guidelineId: g2.id,
      guidelineRef: 'Prohibition of Unaudited Superlatives & Absolute Guarantees',
      evidence: 'Detected prohibited token "100% guarantee".',
      confidence: 0.98,
      suggestedCorrection: 'built to help your team eliminate project delays',
      status: 'OPEN',
      isUnverified: false,
    },
  });

  const f4 = await prisma.finding.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      category: 'FACTUAL_ACCURACY',
      severity: 'HIGH',
      title: 'Outdated & Inaccurate Pricing Statement ("$10/user")',
      excerpt: 'only $10/user',
      explanation: 'NovaTech Pulse Pro tier is priced at $12/user/month (annual billing) or $15/user/month (monthly billing). Advertising $10 is incorrect and creates customer disputes.',
      guidelineId: g5.id,
      guidelineRef: 'Accurate Pricing Statements for Pro Tier',
      sourceId: s3.id,
      sourceRef: 'FY2026 Official Pricing Schedule',
      evidence: 'Official source specifies Pro Tier as $12/user/month. Detected claim: $10/user.',
      confidence: 0.96,
      suggestedCorrection: 'only $12/user/month (billed annually)',
      status: 'OPEN',
      isUnverified: false,
    },
  });

  const f5 = await prisma.finding.create({
    data: {
      reviewId: review1.id,
      versionNum: 1,
      category: 'BRAND_MESSAGING',
      severity: 'MEDIUM',
      title: 'Missing Required Promotional Disclaimer',
      excerpt: 'Upgrade to our Pro tier today',
      explanation: 'Promotional content highlighting tier-specific capabilities must include the approved legal disclaimer: "Features may vary by subscription plan."',
      guidelineId: g4.id,
      guidelineRef: 'Mandatory Subscription Plan Disclaimer in Advertisements',
      sourceId: s4.id,
      sourceRef: 'Legal Disclaimer Standards for Public Marketing',
      evidence: 'Content promotes Pro tier but is missing the required subscription disclaimer text.',
      confidence: 0.92,
      suggestedCorrection: 'Upgrade to our Pro tier today for only $12/user/month. Features may vary by subscription plan.',
      status: 'OPEN',
      isUnverified: false,
    },
  });

  // Comments for Review 1
  const c1 = await prisma.comment.create({
    data: {
      reviewId: review1.id,
      authorId: reviewer.id,
      content: 'Alex, please review the flagged items. Specifically, we cannot claim "world\'s #1" or mention $10 pricing. Update to $12/user/month and include the mandatory subscription disclaimer before we can approve.',
      createdAt: new Date(Date.now() - 3600000 * 20),
    },
  });

  await prisma.comment.create({
    data: {
      reviewId: review1.id,
      authorId: creator.id,
      parentId: c1.id,
      content: 'Understood Marcus. Using the AI correction workspace now to apply the approved replacements and will resubmit for approval shortly.',
      createdAt: new Date(Date.now() - 3600000 * 18),
    },
  });

  await prisma.approvalDecision.create({
    data: {
      reviewId: review1.id,
      decidedById: reviewer.id,
      decision: 'CHANGES_REQUESTED',
      reason: 'Contains 2 critical compliance issues (unsupported superlative & naming error) and outdated pricing.',
      createdAt: new Date(Date.now() - 3600000 * 20),
    },
  });

  // Review 2: DEMO - "Email Newsletter - Distributed Work Trends" (Approved)
  const review2 = await prisma.contentReview.create({
    data: {
      workspaceId: workspace.id,
      creatorId: creator.id,
      reviewerId: reviewer.id,
      title: 'Email Newsletter - Distributed Work Trends',
      contentType: 'EMAIL',
      targetAudience: 'Existing NovaTech Pulse Customers',
      channel: 'Customer Email List (450k subscribers)',
      status: 'APPROVED',
      complianceScore: 97,
      criticalCount: 0,
      highCount: 0,
      mediumCount: 1,
      lowCount: 0,
      currentVersionNum: 2,
      notes: 'Monthly newsletter covering remote collaboration patterns and productivity tips.',
      isDemoRecord: true,
      createdAt: new Date(Date.now() - 3600000 * 24 * 5),
    },
  });

  await prisma.contentVersion.create({
    data: {
      reviewId: review2.id,
      versionNum: 1,
      contentBody: `Welcome to the November edition of NovaTech Pulse Insights!

Distributed teams thrive when communication is clear, asynchronous, and backed by transparent project tracking. Over 450,000 active remote workers rely on NovaTech Pulse every day to keep projects moving forward without unnecessary meetings.

Explore our latest collaborative sprint boards and stay tuned for more product enhancements.`,
      summaryOfChanges: 'Initial draft',
      createdById: creator.id,
      createdAt: new Date(Date.now() - 3600000 * 24 * 5),
    },
  });

  await prisma.contentVersion.create({
    data: {
      reviewId: review2.id,
      versionNum: 2,
      contentBody: `Welcome to the November edition of NovaTech Pulse Insights!

Distributed teams thrive when communication is clear, asynchronous, and backed by transparent project tracking. Over 450,000 active remote workers across 82 countries rely on NovaTech Pulse every day to keep projects moving forward without unnecessary meetings.

Explore our latest collaborative sprint boards and stay tuned for more product enhancements.`,
      summaryOfChanges: 'Enhanced verified geographic statistics from official company source.',
      createdById: creator.id,
      createdAt: new Date(Date.now() - 3600000 * 24 * 4),
    },
  });

  await prisma.approvalDecision.create({
    data: {
      reviewId: review2.id,
      decidedById: reviewer.id,
      decision: 'APPROVED',
      reason: 'Fully compliant with brand voice, accurate factual data, and verified customer metrics.',
      createdAt: new Date(Date.now() - 3600000 * 24 * 4),
    },
  });

  // Review 3: DEMO - "Website Homepage Hero Copy" (In Review)
  const review3 = await prisma.contentReview.create({
    data: {
      workspaceId: workspace.id,
      creatorId: creator.id,
      reviewerId: reviewer.id,
      title: 'Website Homepage Hero Copy 2026',
      contentType: 'WEBSITE_COPY',
      targetAudience: 'Prospective SaaS Enterprise Buyers',
      channel: 'Main Corporate Website (novatech.io)',
      status: 'IN_REVIEW',
      complianceScore: 84,
      criticalCount: 0,
      highCount: 1,
      mediumCount: 1,
      lowCount: 0,
      currentVersionNum: 1,
      notes: 'New headline and subheadline test for the corporate homepage.',
      isDemoRecord: true,
      createdAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  await prisma.contentVersion.create({
    data: {
      reviewId: review3.id,
      versionNum: 1,
      contentBody: `NovaTech Pulse: The Intelligent Productivity Platform for Distributed Teams.

Empower your organization with real-time task tracking, asynchronous daily standups, and enterprise-grade security. Join over 450,000 professionals who collaborate with clarity. Starting at $12/user/month.`,
      summaryOfChanges: 'Initial submission',
      createdById: creator.id,
      createdAt: new Date(Date.now() - 3600000 * 12),
    },
  });

  // Audit Events
  await prisma.auditEvent.createMany({
    data: [
      {
        workspaceId: workspace.id,
        userId: creator.id,
        entityType: 'REVIEW',
        entityId: review1.id,
        action: 'SUBMITTED',
        detailsJson: JSON.stringify({ title: review1.title, versionNum: 1 }),
        createdAt: new Date(Date.now() - 3600000 * 24 * 2),
      },
      {
        workspaceId: workspace.id,
        userId: reviewer.id,
        entityType: 'APPROVAL',
        entityId: review1.id,
        action: 'CHANGES_REQUESTED',
        detailsJson: JSON.stringify({ reason: '2 critical compliance violations' }),
        createdAt: new Date(Date.now() - 3600000 * 20),
      },
      {
        workspaceId: workspace.id,
        userId: reviewer.id,
        entityType: 'APPROVAL',
        entityId: review2.id,
        action: 'APPROVED',
        detailsJson: JSON.stringify({ score: 97, reason: 'Compliant with brand voice' }),
        createdAt: new Date(Date.now() - 3600000 * 24 * 4),
      },
    ],
  });

  // Notifications
  await prisma.notification.createMany({
    data: [
      {
        userId: creator.id,
        title: 'Changes Requested on Review',
        message: 'Marcus Sterling requested updates for "Q4 Social Campaign - NovaTech Pulse Launch".',
        link: `/reviews/${review1.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 20),
      },
      {
        userId: reviewer.id,
        title: 'New Review Ready for Inspection',
        message: 'Alex Rivera submitted "Website Homepage Hero Copy 2026" for compliance review.',
        link: `/reviews/${review3.id}`,
        isRead: false,
        createdAt: new Date(Date.now() - 3600000 * 12),
      },
    ],
  });

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
