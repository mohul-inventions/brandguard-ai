import { DemoRuleEngineAdapter } from '../ai/adapter';
import { BrandGuideline } from '@prisma/client';

export interface EvaluationCase {
  id: string;
  text: string;
  category: 'TERMINOLOGY' | 'PROMOTIONAL_CLAIMS' | 'BRAND_VOICE' | 'CONFIDENTIALITY' | 'COMPLIANT_NEGATIVE';
  expectedViolations: number;
  shouldFlag: boolean;
  notes?: string;
}

export function generateEvaluationDataset(): EvaluationCase[] {
  const dataset: EvaluationCase[] = [];

  // 1. Terminology Violations (40 cases) - Split names, incorrect casings, deprecated branding
  const badTerminology = [
    'Nova Tech', 'Nova-Tech', 'nova tech', 'Nova_Tech', 'pulse ai', 'Pulse-AI', 'PulseAI',
    'NovaTech Pulse Pro Edition', 'Nova tech workspace', 'novatech platform'
  ];
  badTerminology.forEach((term, idx) => {
    dataset.push({
      id: `TERM-POS-${idx * 4 + 1}`,
      text: `We are proud to introduce ${term} for our enterprise customers.`,
      category: 'TERMINOLOGY',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `TERM-POS-${idx * 4 + 2}`,
      text: `Upgrading to ${term} will simplify team workflows and daily operations.`,
      category: 'TERMINOLOGY',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `TERM-POS-${idx * 4 + 3}`,
      text: `Contact sales for ${term} volume licensing and customized onboarding options.`,
      category: 'TERMINOLOGY',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `TERM-POS-${idx * 4 + 4}`,
      text: `Our documentation covers ${term} API integrations and security controls.`,
      category: 'TERMINOLOGY',
      expectedViolations: 1,
      shouldFlag: true,
    });
  });

  // 2. Promotional Claims & Unsubstantiated Superlatives (40 cases)
  const badClaims = [
    '100% foolproof', 'zero downtime guaranteed', 'completely bug-free', 'unbeatable performance',
    'miracle solution', 'magic tool', '100% guarantee', 'undisputed champion', 'the world number one',
    'flawless system'
  ];
  badClaims.forEach((claim, idx) => {
    dataset.push({
      id: `CLAIM-POS-${idx * 4 + 1}`,
      text: `NovaTech Pulse is a ${claim} designed to accelerate enterprise development.`,
      category: 'PROMOTIONAL_CLAIMS',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `CLAIM-POS-${idx * 4 + 2}`,
      text: `Experience ${claim} with our new microservice architecture.`,
      category: 'PROMOTIONAL_CLAIMS',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `CLAIM-POS-${idx * 4 + 3}`,
      text: `We promise ${claim} regardless of team workload or system strain.`,
      category: 'PROMOTIONAL_CLAIMS',
      expectedViolations: 1,
      shouldFlag: true,
    });
    dataset.push({
      id: `CLAIM-POS-${idx * 4 + 4}`,
      text: `Every customer gets ${claim} upon signing up for annual billing.`,
      category: 'PROMOTIONAL_CLAIMS',
      expectedViolations: 1,
      shouldFlag: true,
    });
  });

  // 3. Brand Voice & Casual Slang (30 cases)
  const badSlang = [
    'hella awesome', 'crappy software', 'super cool dude', 'gonna save mad bucks',
    'kinda messy code', 'dope features'
  ];
  badSlang.forEach((slang, idx) => {
    for (let i = 1; i <= 5; i++) {
      dataset.push({
        id: `VOICE-POS-${idx * 5 + i}`,
        text: `Our product team built this ${slang} to make work feel much lighter in iteration ${i}.`,
        category: 'BRAND_VOICE',
        expectedViolations: 1,
        shouldFlag: true,
      });
    }
  });

  // 4. Confidentiality & Security Leaks (20 cases)
  const secrets = [
    'sk_live_998877665544332211', 'staging.internal.novatech.io', 'Project Hyperion', 'Project Titan'
  ];
  secrets.forEach((sec, idx) => {
    for (let i = 1; i <= 5; i++) {
      dataset.push({
        id: `CONF-POS-${idx * 5 + i}`,
        text: `Do not disclose: target environment is ${sec} for test run ${i}.`,
        category: 'CONFIDENTIALITY',
        expectedViolations: 1,
        shouldFlag: true,
      });
    }
  });

  // 5. Compliant Negative Controls (70 cases) - Valid enterprise text that must NOT trigger violations
  const validPhrases = [
    'NovaTech Pulse delivers enterprise-grade collaboration with role-based access controls.',
    'Our team is committed to continuous improvement, high reliability, and data privacy.',
    'Customers can review our SOC 2 Type II compliance reports and audit certifications.',
    'The platform architecture supports horizontally scalable workloads across multiple cloud regions.',
    'We offer 99.99% operational uptime commitments backed by transparent service level agreements.',
    'NovaTech solutions integrate seamlessly with existing enterprise identity providers.',
    'Our engineering team adheres to rigorous security guidelines and automated testing standards.',
    'Detailed release notes describe the bug fixes and performance enhancements in this version.',
    'Pricing starts at $12 per user per month when billed annually for the professional plan.',
    'Features may vary by subscription plan and administrative role assignments.',
    'NovaTech provides automated content governance for multi-disciplinary marketing organizations.',
    'Audit logs record all approvals, rejections, and version revisions with timestamp verification.',
    'Enterprise customers benefit from dedicated account management and customized training sessions.',
    'The documentation provides clear step-by-step guidance for configuring single sign-on.'
  ];

  validPhrases.forEach((phrase, idx) => {
    for (let i = 1; i <= 5; i++) {
      dataset.push({
        id: `COMPLIANT-NEG-${idx * 5 + i}`,
        text: `${phrase} (Sample segment ${i} for enterprise evaluation).`,
        category: 'COMPLIANT_NEGATIVE',
        expectedViolations: 0,
        shouldFlag: false,
      });
    }
  });

  return dataset;
}
