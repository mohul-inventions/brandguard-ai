import { Request, Response } from 'express';
import prisma from '../db';
import { ScoringService } from '../services/scoringService';
import { recordAuditEvent } from '../utils/audit';

export const updateFindingStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const userId = req.user?.id;

    if (!['OPEN', 'ACCEPTED', 'DISMISSED', 'FIXED', 'NEEDS_REVIEW'].includes(status)) {
      res.status(400).json({ error: `Invalid status: ${status}` });
      return;
    }

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: { review: true },
    });

    if (!finding) {
      res.status(404).json({ error: 'Finding not found.' });
      return;
    }

    const updated = await prisma.finding.update({
      where: { id },
      data: { status },
    });

    // Recalculate review compliance score based on updated findings
    const allFindings = await prisma.finding.findMany({
      where: { reviewId: finding.reviewId, versionNum: finding.versionNum },
    });
    const scoreSummary = ScoringService.calculateScore(allFindings);

    await prisma.contentReview.update({
      where: { id: finding.reviewId },
      data: {
        complianceScore: scoreSummary.overallScore,
        criticalCount: scoreSummary.criticalCount,
        highCount: scoreSummary.highCount,
        mediumCount: scoreSummary.mediumCount,
        lowCount: scoreSummary.lowCount,
      },
    });

    if (userId) {
      await recordAuditEvent({
        workspaceId: finding.review.workspaceId,
        userId,
        entityType: 'REVIEW',
        entityId: finding.reviewId,
        action: 'CORRECTION_APPLIED',
        details: { findingId: id, newStatus: status, newScore: scoreSummary.overallScore },
      });
    }

    res.json({
      finding: updated,
      scoreSummary,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update finding status.' });
  }
};

export const applyCorrection = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const finding = await prisma.finding.findUnique({
      where: { id },
      include: {
        review: {
          include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } },
        },
        suggestedCorrections: true,
      },
    });

    if (!finding || !finding.suggestedCorrection) {
      res.status(404).json({ error: 'Finding or suggested correction not found.' });
      return;
    }

    // Mark finding as ACCEPTED / FIXED
    const updatedFinding = await prisma.finding.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    if (finding.suggestedCorrections.length > 0) {
      await prisma.suggestedCorrection.updateMany({
        where: { findingId: id },
        data: { isApplied: true, appliedAt: new Date() },
      });
    }

    res.json({
      success: true,
      finding: updatedFinding,
      originalText: finding.excerpt,
      replacementText: finding.suggestedCorrection,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to apply correction.' });
  }
};
