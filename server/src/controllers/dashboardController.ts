import { Request, Response } from 'express';
import prisma from '../db';

export const getDashboardSummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    if (!workspaceId) {
      res.status(400).json({ error: 'Workspace ID required.' });
      return;
    }

    // 1. Core Summary Metrics
    const totalReviews = await prisma.contentReview.count({
      where: { workspaceId },
    });

    const pendingApprovals = await prisma.contentReview.count({
      where: {
        workspaceId,
        status: { in: ['SUBMITTED', 'IN_REVIEW', 'REVISED'] },
      },
    });

    const criticalIssues = await prisma.finding.count({
      where: {
        review: { workspaceId },
        severity: 'CRITICAL',
        status: { in: ['OPEN', 'NEEDS_REVIEW'] },
      },
    });

    const reviewsWithScore = await prisma.contentReview.findMany({
      where: { workspaceId },
      select: { complianceScore: true },
    });

    const avgComplianceScore =
      reviewsWithScore.length > 0
        ? Math.round(reviewsWithScore.reduce((acc, r) => acc + r.complianceScore, 0) / reviewsWithScore.length)
        : 100;

    // 2. Issues by Severity
    const allFindings = await prisma.finding.findMany({
      where: { review: { workspaceId } },
      select: { severity: true, category: true, status: true, title: true },
    });

    const severityBreakdown = {
      CRITICAL: allFindings.filter((f) => f.severity === 'CRITICAL').length,
      HIGH: allFindings.filter((f) => f.severity === 'HIGH').length,
      MEDIUM: allFindings.filter((f) => f.severity === 'MEDIUM').length,
      LOW: allFindings.filter((f) => f.severity === 'LOW').length,
    };

    // 3. Issues by Category
    const categoryCounts: Record<string, number> = {};
    for (const f of allFindings) {
      categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
    }

    const categoryBreakdown = Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
    }));

    // 4. Compliance Score Trend (Chronological reviews)
    const recentReviews = await prisma.contentReview.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 6,
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    const scoreTrend = recentReviews
      .slice()
      .reverse()
      .map((r) => ({
        date: r.createdAt.toISOString().split('T')[0],
        title: r.title.length > 20 ? r.title.substring(0, 20) + '...' : r.title,
        score: r.complianceScore,
      }));

    // 5. Pending Approvals List
    const pendingList = await prisma.contentReview.findMany({
      where: {
        workspaceId,
        status: { in: ['SUBMITTED', 'IN_REVIEW', 'REVISED'] },
      },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        creator: { select: { name: true, email: true, avatarUrl: true } },
      },
    });

    // 6. Most Common Brand Violations
    const violationMap: Record<string, { title: string; category: string; count: number; severity: string }> = {};
    for (const f of allFindings) {
      if (!violationMap[f.title]) {
        violationMap[f.title] = {
          title: f.title,
          category: f.category,
          count: 0,
          severity: f.severity,
        };
      }
      violationMap[f.title].count += 1;
    }
    const commonViolations = Object.values(violationMap)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 7. Latest Guideline Updates
    const latestGuidelines = await prisma.brandGuideline.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      take: 4,
    });

    // 8. Team Activity / Audit Trail
    const teamActivity = await prisma.auditEvent.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
      take: 8,
      include: {
        user: { select: { name: true, email: true, role: true, avatarUrl: true } },
      },
    });

    res.json({
      summary: {
        totalReviews,
        pendingApprovals,
        criticalIssues,
        avgComplianceScore,
      },
      charts: {
        scoreTrend,
        severityBreakdown,
        categoryBreakdown,
      },
      recentReviews,
      pendingList,
      commonViolations,
      latestGuidelines,
      teamActivity,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch dashboard summary.' });
  }
};
