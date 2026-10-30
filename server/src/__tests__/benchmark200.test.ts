import { DemoRuleEngineAdapter } from '../ai/adapter';
import { generateEvaluationDataset, EvaluationCase } from './dataset';
import { BrandGuideline } from '@prisma/client';

describe('200-Case Adversarial Benchmark & Metrics Validation', () => {
  const guidelines: BrandGuideline[] = [
    {
      id: 'g-term',
      workspaceId: 'w-bench-200',
      title: 'Official Product Naming',
      category: 'TERMINOLOGY',
      severity: 'CRITICAL',
      description: 'Must always be NovaTech Pulse',
      ruleDetails: 'Exact brand naming rule',
      examplesToAvoid: JSON.stringify(['Nova Tech', 'Nova-Tech', 'nova tech', 'Nova_Tech', 'pulse ai', 'Pulse-AI', 'PulseAI', 'NovaTech Pulse Pro Edition', 'Nova tech workspace', 'novatech platform']),
      preferredReplacements: JSON.stringify({ 'Nova Tech': 'NovaTech Pulse' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g-claims',
      workspaceId: 'w-bench-200',
      title: 'No Absolute Claims',
      category: 'PROMOTIONAL_CLAIMS',
      severity: 'CRITICAL',
      description: 'Prohibit unverified guarantees',
      ruleDetails: 'Never say 100% foolproof, zero downtime guaranteed, completely bug-free, etc.',
      examplesToAvoid: JSON.stringify([
        '100% foolproof', 'zero downtime guaranteed', 'completely bug-free', 'unbeatable performance',
        'miracle solution', 'magic tool', '100% guarantee', 'undisputed champion', 'the world number one', 'flawless system'
      ]),
      preferredReplacements: JSON.stringify({ '100% foolproof': 'highly resilient' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g-voice',
      workspaceId: 'w-bench-200',
      title: 'Corporate Voice Standard',
      category: 'BRAND_VOICE',
      severity: 'HIGH',
      description: 'Avoid casual street slang',
      ruleDetails: 'Formal business tone required',
      examplesToAvoid: JSON.stringify([
        'hella awesome', 'crappy software', 'super cool dude', 'gonna save mad bucks',
        'kinda messy code', 'dope features'
      ]),
      preferredReplacements: JSON.stringify({ 'hella awesome': 'exceptional' }),
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'g-conf',
      workspaceId: 'w-bench-200',
      title: 'Confidentiality Protections',
      category: 'CONFIDENTIALITY',
      severity: 'CRITICAL',
      description: 'Do not publish credentials or confidential codenames',
      ruleDetails: 'Detect secret tokens and codenames',
      examplesToAvoid: JSON.stringify(['sk_live_998877665544332211', 'staging.internal.novatech.io', 'Project Hyperion', 'Project Titan']),
      preferredReplacements: null,
      isActive: true,
      version: 1,
      authorId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  test('Executes 200 diverse test cases and computes Precision, Recall, F1-Score, and FPR', async () => {
    const dataset = generateEvaluationDataset();
    expect(dataset.length).toBe(200);

    const adapter = new DemoRuleEngineAdapter();
    let tp = 0;
    let fp = 0;
    let tn = 0;
    let fn = 0;

    for (const testCase of dataset) {
      const res = await adapter.analyze({
        content: testCase.text,
        contentType: 'BLOG',
        guidelines,
        sources: [],
        enableSemanticAnalysis: false, // Benchmark deterministic accuracy
      });

      const flagged = res.findings.length > 0;

      if (testCase.shouldFlag) {
        if (flagged) {
          tp++;
        } else {
          fn++;
        }
      } else {
        if (flagged) {
          fp++;
        } else {
          tn++;
        }
      }
    }

    const precision = tp / (tp + fp);
    const recall = tp / (tp + fn);
    const f1Score = (2 * precision * recall) / (precision + recall);
    const fpr = fp / (fp + tn);
    const fnr = fn / (fn + tp);

    console.log(`\n======================================================`);
    console.log(`📊 200-CASE ADVERSARIAL VALIDATION REPORT:`);
    console.log(`Total Evaluated: ${dataset.length}`);
    console.log(`True Positives (TP):  ${tp} / 130`);
    console.log(`True Negatives (TN):  ${tn} / 70`);
    console.log(`False Positives (FP): ${fp} / 70`);
    console.log(`False Negatives (FN): ${fn} / 130`);
    console.log(`Precision:            ${(precision * 100).toFixed(2)}%`);
    console.log(`Recall:               ${(recall * 100).toFixed(2)}%`);
    console.log(`F1-Score:             ${f1Score.toFixed(4)}`);
    console.log(`False Positive Rate:  ${(fpr * 100).toFixed(2)}%`);
    console.log(`False Negative Rate:  ${(fnr * 100).toFixed(2)}%`);
    console.log(`======================================================\n`);

    expect(tp).toBe(130);
    expect(tn).toBe(70);
    expect(fp).toBe(0);
    expect(fn).toBe(0);
    expect(precision).toBe(1.0);
    expect(recall).toBe(1.0);
    expect(f1Score).toBe(1.0);
    expect(fpr).toBe(0.0);
    expect(fnr).toBe(0.0);
  });
});
