import { DemoRuleEngineAdapter } from '../ai/adapter';
import { ScoringService } from '../services/scoringService';
import { BrandGuideline, ApprovedSource } from '@prisma/client';

describe('Precision, Recall & Edge-Case Benchmark Suite', () => {
  const guidelines: BrandGuideline[] = [
    {
      id: 'g-term-1',
      workspaceId: 'w-bench',
      title: 'Official Product Naming',
      category: 'TERMINOLOGY',
      severity: 'CRITICAL',
      description: 'Must always be NovaTech Pulse. Never split as Nova Tech.',
      ruleDetails: 'Exact brand naming rule',
      examplesToAvoid: JSON.stringify(['Nova Tech', 'Nova-Tech']),
      preferredReplacements: JSON.stringify({ 'Nova Tech': 'NovaTech' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g-claim-1',
      workspaceId: 'w-bench',
      title: 'Prohibit Absolute Guarantees',
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'CRITICAL',
      description: 'Prohibit legally indefensible guarantees',
      ruleDetails: 'Never say 100% foolproof or completely bug-free',
      examplesToAvoid: JSON.stringify(['100% foolproof', 'completely bug-free', 'zero downtime guaranteed']),
      preferredReplacements: JSON.stringify({ '100% foolproof': 'highly resilient' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g-voice-1',
      workspaceId: 'w-bench',
      title: 'Formal Enterprise Voice',
      category: 'BRAND_VOICE',
      severity: 'HIGH',
      description: 'Avoid casual street slang and inappropriate jargon',
      ruleDetails: 'Tone standard',
      examplesToAvoid: JSON.stringify(['hella awesome', 'crappy software']),
      preferredReplacements: JSON.stringify({ 'hella awesome': 'exceptional' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const testCorpus = [
    // 5 True Positives (Must trigger violations)
    { id: 'TP-1', text: 'Welcome to Nova Tech, our newest collaboration tool.', expectedViolations: 1, shouldFlag: true },
    { id: 'TP-2', text: 'Our infrastructure provides zero downtime guaranteed for enterprises.', expectedViolations: 1, shouldFlag: true },
    { id: 'TP-3', text: 'This solution is 100% foolproof and requires no onboarding.', expectedViolations: 1, shouldFlag: true },
    { id: 'TP-4', text: 'Migrating away from crappy software has never been easier.', expectedViolations: 1, shouldFlag: true },
    { id: 'TP-5', text: 'Nova Tech offers hella awesome productivity benefits.', expectedViolations: 2, shouldFlag: true },

    // 5 True Negatives (Compliant text that must NOT trigger false positives)
    { id: 'TN-1', text: 'NovaTech delivers reliable enterprise-grade security for modern cloud teams.', expectedViolations: 0, shouldFlag: false },
    { id: 'TN-2', text: 'Our resilient platform achieves 99.99% operational uptime across global regions.', expectedViolations: 0, shouldFlag: false },
    { id: 'TN-3', text: 'NovaTech Pulse streamlines cross-functional workflows with automated audit logging.', expectedViolations: 0, shouldFlag: false },
    { id: 'TN-4', text: 'Built on open standards, our architecture integrates with existing enterprise systems.', expectedViolations: 0, shouldFlag: false },
    { id: 'TN-5', text: 'Reviewers evaluate compliance and maintain brand consistency across all marketing channels.', expectedViolations: 0, shouldFlag: false },
  ];

  test('Evaluates benchmark corpus with 100% precision and zero false positives', async () => {
    const adapter = new DemoRuleEngineAdapter();
    let truePositives = 0;
    let falsePositives = 0;
    let trueNegatives = 0;
    let falseNegatives = 0;

    for (const item of testCorpus) {
      const res = await adapter.analyze({
        content: item.text,
        contentType: 'BLOG',
        guidelines,
        sources: [],
        enableSemanticAnalysis: false, // Benchmark deterministic layer
      });

      const flagged = res.findings.length > 0;

      if (item.shouldFlag) {
        if (flagged) {
          truePositives++;
        } else {
          falseNegatives++;
        }
      } else {
        if (flagged) {
          falsePositives++;
        } else {
          trueNegatives++;
        }
      }
    }

    const precision = truePositives / (truePositives + falsePositives);
    const recall = truePositives / (truePositives + falseNegatives);

    expect(precision).toBe(1.0); // 100% Precision
    expect(recall).toBe(1.0);    // 100% Recall
    expect(falsePositives).toBe(0);
    expect(falseNegatives).toBe(0);
  });

  test('Critical violations cannot be masked by score math', () => {
    // Single critical finding
    const dummyFindings: any[] = [
      {
        id: 'f-crit',
        status: 'OPEN',
        severity: 'CRITICAL',
        category: 'TERMINOLOGY',
        title: 'Critical Issue',
      },
    ];

    const summary = ScoringService.calculateScore(dummyFindings);
    expect(summary.hasUnresolvedCritical).toBe(true);
    expect(summary.criticalCount).toBe(1);
    expect(summary.scoreExplanation).toContain('WARNING: 1 unresolved critical issue(s) detected');
  });
});
