import { Request, Response } from 'express';
import prisma from '../db';

export const getAnalyticsOverview = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID required.' });
      return;
    }

    const { category, days } = req.query;
    const daysNum = days ? parseInt(days as string, 10) : 30;
    const sinceDate = new Date(Date.now() - daysNum * 24 * 3600 * 1000);

    const findingsWhere: any = {
      review: {
        workspaceId,
        createdAt: { gte: sinceDate },
      },
    };

    if (category && category !== 'ALL') {
      findingsWhere.category = category as string;
    }

    const findings = await prisma.finding.findMany({
      where: findingsWhere,
      include: {
        guideline: true,
        source: true,
        review: true,
      },
    });

    const reviews = await prisma.contentReview.findMany({
      where: {
        workspaceId,
        createdAt: { gte: sinceDate },
      },
      include: {
        versions: true,
        approvalDecisions: true,
      },
    });

    // 1. Recurring Violations Aggregation
    const violationMap: Record<string, { title: string; category: string; count: number; severity: string }> = {};
    for (const f of findings) {
      if (!violationMap[f.title]) {
        violationMap[f.title] = { title: f.title, category: f.category, count: 0, severity: f.severity };
      }
      violationMap[f.title].count += 1;
    }
    const frequentViolations = Object.values(violationMap).sort((a, b) => b.count - a.count);

    // 2. Specific Sub-groups: Terminology & Unsupported Claims
    const terminologyErrors = frequentViolations.filter((v) => v.category === 'TERMINOLOGY');
    const unsupportedClaims = frequentViolations.filter((v) => v.category === 'PROMOTIONAL_CLAIMS' || v.category === 'FACTUAL_ACCURACY');

    // 3. Revisions per content item
    const totalRevisions = reviews.reduce((acc, r) => acc + (r.versions.length - 1), 0);
    const avgRevisionsPerReview = reviews.length > 0 ? Number((totalRevisions / reviews.length).toFixed(1)) : 0;

    // 4. Content Type Distribution
    const contentTypeMap: Record<string, { count: number; avgScore: number; totalScore: number }> = {};
    for (const r of reviews) {
      if (!contentTypeMap[r.contentType]) {
        contentTypeMap[r.contentType] = { count: 0, avgScore: 0, totalScore: 0 };
      }
      contentTypeMap[r.contentType].count += 1;
      contentTypeMap[r.contentType].totalScore += r.complianceScore;
    }
    const issuesByContentType = Object.entries(contentTypeMap).map(([type, stats]) => ({
      contentType: type,
      reviewCount: stats.count,
      avgComplianceScore: Math.round(stats.totalScore / stats.count),
    }));

    // 5. Guidelines with most violations
    const guidelineViolationsMap: Record<string, { title: string; count: number; category: string }> = {};
    for (const f of findings) {
      const gTitle = f.guideline?.title || f.guidelineRef || 'General Governance Policy';
      if (!guidelineViolationsMap[gTitle]) {
        guidelineViolationsMap[gTitle] = { title: gTitle, count: 0, category: f.category };
      }
      guidelineViolationsMap[gTitle].count += 1;
    }
    const topViolatedGuidelines = Object.values(guidelineViolationsMap).sort((a, b) => b.count - a.count);

    // 6. Actionable Governance Recommendations
    const recommendations: string[] = [];

    if (terminologyErrors.length > 0 && terminologyErrors[0].count >= 1) {
      recommendations.push(
        `Brand Naming Violation "${terminologyErrors[0].title}" occurred repeatedly. Consider distributing a quick-reference one-pager or team training on approved product branding.`
      );
    }

    if (unsupportedClaims.length > 0) {
      recommendations.push(
        `Promotional claims such as "${unsupportedClaims[0].title}" require legal backing. Ensure creators have access to the latest G2 & market intelligence benchmark sources.`
      );
    }

    if (avgRevisionsPerReview > 1.5) {
      recommendations.push(
        `Average revisions per review is ${avgRevisionsPerReview}. Enabling pre-submission automated checks in the editor will significantly decrease turnaround delays.`
      );
    } else {
      recommendations.push(
        `Review turnaround is currently healthy. Maintain active guideline version reviews every quarter to align with marketing updates.`
      );
    }

    const isPreliminary = reviews.length < 15;

    res.json({
      timeframeDays: daysNum,
      isPreliminary,
      summary: {
        totalReviewsAnalyzed: reviews.length,
        totalViolationsFound: findings.length,
        avgRevisionsPerReview,
      },
      frequentViolations: frequentViolations.slice(0, 10),
      terminologyErrors: terminologyErrors.slice(0, 5),
      unsupportedClaims: unsupportedClaims.slice(0, 5),
      issuesByContentType,
      topViolatedGuidelines: topViolatedGuidelines.slice(0, 8),
      actionableRecommendations: recommendations,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch governance analytics.' });
  }
};
