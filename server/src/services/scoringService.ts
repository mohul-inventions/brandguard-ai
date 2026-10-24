import { Finding } from '@prisma/client';

export interface ScoreSummary {
  overallScore: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  totalIssues: number;
  resolvedIssues: number;
  categoryScores: Record<string, number>;
  hasUnresolvedCritical: boolean;
  scoreExplanation: string;
}

export class ScoringService {
  /**
   * Transparent deterministic scoring model
   */
  static calculateScore(findings: Finding[]): ScoreSummary {
    const openFindings = findings.filter((f) => f.status === 'OPEN' || f.status === 'NEEDS_REVIEW');
    const resolvedFindings = findings.filter((f) => f.status === 'ACCEPTED' || f.status === 'FIXED' || f.status === 'DISMISSED');

    const criticalCount = openFindings.filter((f) => f.severity === 'CRITICAL').length;
    const highCount = openFindings.filter((f) => f.severity === 'HIGH').length;
    const mediumCount = openFindings.filter((f) => f.severity === 'MEDIUM').length;
    const lowCount = openFindings.filter((f) => f.severity === 'LOW').length;

    const baseScore = 100;
    const deductions = criticalCount * 25 + highCount * 15 + mediumCount * 8 + lowCount * 3;
    const overallScore = Math.max(0, baseScore - deductions);

    const categories = [
      'BRAND_VOICE',
      'TERMINOLOGY',
      'FACTUAL_ACCURACY',
      'PROMOTIONAL_CLAIMS',
      'BRAND_MESSAGING',
      'VISUAL_COMPLIANCE',
      'ACCESSIBILITY',
      'CONFIDENTIALITY',
    ];

    const categoryScores: Record<string, number> = {};
    for (const cat of categories) {
      const catOpen = openFindings.filter((f) => f.category === cat);
      const catDeductions =
        catOpen.filter((f) => f.severity === 'CRITICAL').length * 40 +
        catOpen.filter((f) => f.severity === 'HIGH').length * 25 +
        catOpen.filter((f) => f.severity === 'MEDIUM').length * 15 +
        catOpen.filter((f) => f.severity === 'LOW').length * 5;
      categoryScores[cat] = Math.max(0, 100 - catDeductions);
    }

    const hasUnresolvedCritical = criticalCount > 0;
    let scoreExplanation = `Score calculated from ${openFindings.length} open findings.`;
    if (hasUnresolvedCritical) {
      scoreExplanation += ` WARNING: ${criticalCount} unresolved critical issue(s) detected. Content cannot be published without resolution.`;
    }

    return {
      overallScore,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      totalIssues: findings.length,
      resolvedIssues: resolvedFindings.length,
      categoryScores,
      hasUnresolvedCritical,
      scoreExplanation,
    };
  }
}
