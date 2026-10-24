import { DemoRuleEngineAdapter } from '../ai/adapter';
import { ScoringService } from '../services/scoringService';
import { BrandGuideline, ApprovedSource, Finding } from '@prisma/client';

describe('BrandGuard AI Compliance Engine Tests', () => {
  const mockGuidelines: BrandGuideline[] = [
    {
      id: 'g1',
      workspaceId: 'w1',
      title: 'Official Product Naming',
      category: 'TERMINOLOGY',
      severity: 'CRITICAL',
      description: 'Must always be NovaTech Pulse',
      ruleDetails: 'Never split into Nova Tech',
      examplesToAvoid: JSON.stringify(['Nova Tech', 'Pulse AI']),
      preferredReplacements: JSON.stringify({ 'Nova Tech': 'NovaTech' }),
      isActive: true,
      version: 1,
      authorId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g2',
      workspaceId: 'w1',
      title: 'No Absolute Superlatives',
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'CRITICAL',
      description: 'Prohibit unverified superlative claims',
      ruleDetails: 'Never say world number one without audit proof',
      examplesToAvoid: JSON.stringify(["the world's number one", '100% guarantee']),
      preferredReplacements: JSON.stringify({ "the world's number one": 'an industry-leading' }),
      isActive: true,
      version: 1,
      authorId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g3',
      workspaceId: 'w1',
      title: 'Mandatory Subscription Disclaimer',
      category: 'BRAND_MESSAGING',
      severity: 'HIGH',
      description: 'Requires disclaimer on ads',
      ruleDetails: 'Must include features may vary by subscription plan',
      examplesToAvoid: JSON.stringify([]),
      preferredReplacements: null,
      isActive: true,
      version: 1,
      authorId: 'u1',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const mockSources: ApprovedSource[] = [
    {
      id: 's1',
      workspaceId: 'w1',
      title: 'FY2026 Official Pricing Schedule',
      sourceType: 'PRICING',
      content: 'Pro Tier: $12 per user/month billed annually ($15 billed monthly).',
      referenceUrl: 'https://novatech.io/pricing',
      owner: 'Finance Committee',
      verificationDate: new Date(),
      expirationDate: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 's2',
      workspaceId: 'w1',
      title: 'G2 Winter 2026 Market Report',
      sourceType: 'STATISTIC',
      content: 'NovaTech Pulse was rated #2 in Remote Collaboration Workspaces.',
      referenceUrl: 'https://g2.com/reports',
      owner: 'Competitive Intelligence',
      verificationDate: new Date(),
      expirationDate: null,
      status: 'ACTIVE',
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  test('Deterministic rule engine correctly flags brand naming and unsupported superlatives', async () => {
    const adapter = new DemoRuleEngineAdapter();
    const testContent = "Introducing Nova Tech Pulse - the world's number one productivity platform! Upgrade now for only $10/user.";

    const result = await adapter.analyze({
      content: testContent,
      contentType: 'ADVERTISEMENT',
      guidelines: mockGuidelines,
      sources: mockSources,
    });

    expect(result.findings.length).toBeGreaterThanOrEqual(3);

    // Verify finding 1: Terminology
    const termFinding = result.findings.find((f) => f.category === 'TERMINOLOGY');
    expect(termFinding).toBeDefined();
    expect(termFinding?.excerpt).toContain('Nova Tech');
    expect(termFinding?.severity).toBe('CRITICAL');
    expect(termFinding?.suggestedCorrection).toBe('NovaTech');

    // Verify finding 2: Promotional Superlative
    const promoFinding = result.findings.find((f) => f.category === 'PROMOTIONAL_CLAIMS');
    expect(promoFinding).toBeDefined();
    expect(promoFinding?.severity).toBe('CRITICAL');

    // Verify finding 3: Factual pricing discrepancy
    const factFinding = result.findings.find((f) => f.category === 'FACTUAL_ACCURACY');
    expect(factFinding).toBeDefined();
    expect(factFinding?.excerpt).toContain('$10');
    expect(factFinding?.suggestedCorrection).toContain('$12/user/month');
  });

  test('Scoring methodology accurately computes deductions and alerts on unresolved critical issues', () => {
    const mockFindings = [
      {
        id: 'f1',
        reviewId: 'r1',
        versionNum: 1,
        category: 'TERMINOLOGY',
        severity: 'CRITICAL',
        title: 'Naming Violation',
        excerpt: 'Nova Tech',
        explanation: 'Split naming',
        guidelineId: 'g1',
        guidelineRef: 'Product Naming',
        sourceId: null,
        sourceRef: null,
        evidence: 'Matched token',
        confidence: 0.99,
        suggestedCorrection: 'NovaTech',
        status: 'OPEN',
        isUnverified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'f2',
        reviewId: 'r1',
        versionNum: 1,
        category: 'BRAND_VOICE',
        severity: 'HIGH',
        title: 'Hype Words',
        excerpt: 'insane speed',
        explanation: 'Avoid hype',
        guidelineId: 'g2',
        guidelineRef: 'Tone',
        sourceId: null,
        sourceRef: null,
        evidence: 'Matched token',
        confidence: 0.95,
        suggestedCorrection: 'rapid execution',
        status: 'OPEN',
        isUnverified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Finding[];

    const score = ScoringService.calculateScore(mockFindings);

    // Critical (-25) + High (-15) = 100 - 40 = 60
    expect(score.overallScore).toBe(60);
    expect(score.criticalCount).toBe(1);
    expect(score.highCount).toBe(1);
    expect(score.hasUnresolvedCritical).toBe(true);
    expect(score.scoreExplanation).toContain('WARNING: 1 unresolved critical issue(s) detected');
  });

  test('Critical findings remain visible even when overall compliance score is high', () => {
    // A single critical finding in a long otherwise clean document
    const singleCriticalFinding = [
      {
        id: 'f1',
        reviewId: 'r1',
        versionNum: 1,
        category: 'CONFIDENTIALITY',
        severity: 'CRITICAL',
        title: 'Internal Secret Key Exposure',
        excerpt: 'sk_live_1234567890abcdef',
        explanation: 'API key detected',
        guidelineId: 'g8',
        guidelineRef: 'Confidentiality',
        sourceId: null,
        sourceRef: null,
        evidence: 'Matched token',
        confidence: 0.99,
        suggestedCorrection: '[REDACTED]',
        status: 'OPEN',
        isUnverified: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ] as Finding[];

    const score = ScoringService.calculateScore(singleCriticalFinding);

    // 100 - 25 = 75 score (which is nominally high/green)
    expect(score.overallScore).toBe(75);
    // But hasUnresolvedCritical MUST be true and prevent approval!
    expect(score.hasUnresolvedCritical).toBe(true);
    expect(score.criticalCount).toBe(1);
  });
});
