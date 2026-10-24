import prisma from '../db';
import { getAIProvider } from '../ai/adapter';
import { ScoringService } from './scoringService';
import { recordAuditEvent } from '../utils/audit';
import { ContentType } from '../types';

export interface SubmitReviewInput {
  workspaceId: string;
  creatorId: string;
  title: string;
  contentType: ContentType;
  targetAudience?: string;
  channel?: string;
  contentBody: string;
  imageAttachmentUrl?: string;
  notes?: string;
}

export class ReviewEngine {
  /**
   * Submit and immediately analyze a new piece of content
   */
  static async submitAndAnalyze(input: SubmitReviewInput) {
    // 1. Create ContentReview record
    const review = await prisma.contentReview.create({
      data: {
        workspaceId: input.workspaceId,
        creatorId: input.creatorId,
        title: input.title,
        contentType: input.contentType,
        targetAudience: input.targetAudience,
        channel: input.channel,
        status: 'SUBMITTED',
        imageAttachmentUrl: input.imageAttachmentUrl,
        notes: input.notes,
        currentVersionNum: 1,
      },
    });

    // 2. Create initial Version 1
    await prisma.contentVersion.create({
      data: {
        reviewId: review.id,
        versionNum: 1,
        contentBody: input.contentBody,
        summaryOfChanges: 'Initial content submission',
        createdById: input.creatorId,
      },
    });

    // 3. Run Analysis Pipeline
    const analysisResult = await this.runAnalysis(review.id, 1, input.contentBody, input.imageAttachmentUrl);

    // 4. Log Audit Event
    await recordAuditEvent({
      workspaceId: input.workspaceId,
      userId: input.creatorId,
      entityType: 'REVIEW',
      entityId: review.id,
      action: 'SUBMITTED',
      details: {
        title: input.title,
        contentType: input.contentType,
        initialScore: analysisResult.overallScore,
        findingsCount: analysisResult.findings.length,
      },
    });

    return {
      review,
      analysisResult,
    };
  }

  /**
   * Run or Re-run AI analysis on a specific version of a review
   */
  static async runAnalysis(reviewId: string, versionNum: number, contentBody: string, imageAttachmentUrl?: string | null) {
    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
      include: { workspace: true },
    });

    if (!review) throw new Error('Review not found');

    // Fetch active brand guidelines and active sources for the workspace
    const guidelines = await prisma.brandGuideline.findMany({
      where: { workspaceId: review.workspaceId, isActive: true },
    });

    const sources = await prisma.approvedSource.findMany({
      where: { workspaceId: review.workspaceId, status: 'ACTIVE' },
    });

    // Remove any existing findings for this version if re-running
    await prisma.finding.deleteMany({
      where: { reviewId, versionNum },
    });

    // Call AI provider adapter
    const provider = getAIProvider();
    const result = await provider.analyze({
      content: contentBody,
      contentType: review.contentType,
      targetAudience: review.targetAudience || undefined,
      channel: review.channel || undefined,
      imageAttachmentUrl: imageAttachmentUrl || review.imageAttachmentUrl || undefined,
      guidelines,
      sources,
    });

    // Persist Findings
    for (const item of result.findings) {
      const createdFinding = await prisma.finding.create({
        data: {
          reviewId,
          versionNum,
          category: item.category,
          severity: item.severity,
          title: item.title,
          excerpt: item.excerpt,
          explanation: item.explanation,
          guidelineId: item.guidelineId,
          guidelineRef: item.guidelineRef,
          sourceId: item.sourceId,
          sourceRef: item.sourceRef,
          evidence: item.evidence,
          confidence: item.confidence,
          suggestedCorrection: item.suggestedCorrection,
          isUnverified: item.isUnverified || false,
          status: 'OPEN',
        },
      });

      // Persist SuggestedCorrection if available
      if (item.suggestedCorrection) {
        await prisma.suggestedCorrection.create({
          data: {
            findingId: createdFinding.id,
            originalText: item.excerpt,
            proposedReplacement: item.suggestedCorrection,
            reasoning: item.explanation,
          },
        });
      }
    }

    // Update review scores and counts
    const allFindings = await prisma.finding.findMany({
      where: { reviewId, versionNum },
    });
    const scoreSummary = ScoringService.calculateScore(allFindings);

    const updatedReview = await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        complianceScore: scoreSummary.overallScore,
        criticalCount: scoreSummary.criticalCount,
        highCount: scoreSummary.highCount,
        mediumCount: scoreSummary.mediumCount,
        lowCount: scoreSummary.lowCount,
      },
    });

    return {
      review: updatedReview,
      findings: allFindings,
      overallScore: scoreSummary.overallScore,
      scoreSummary,
      engineUsed: result.engineUsed,
      disclaimer: result.disclaimer,
    };
  }

  /**
   * Save a revised version of the review and re-evaluate compliance
   */
  static async saveRevision(
    reviewId: string,
    userId: string,
    revisedContent: string,
    summaryOfChanges: string,
    appliedCorrectionIds: string[] = []
  ) {
    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
      include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } },
    });

    if (!review) throw new Error('Review not found');

    const nextVersionNum = review.currentVersionNum + 1;

    // Create next version
    await prisma.contentVersion.create({
      data: {
        reviewId,
        versionNum: nextVersionNum,
        contentBody: revisedContent,
        summaryOfChanges: summaryOfChanges || `Revision v${nextVersionNum} with applied corrections`,
        createdById: userId,
      },
    });

    // Mark applied corrections
    if (appliedCorrectionIds.length > 0) {
      await prisma.suggestedCorrection.updateMany({
        where: { id: { in: appliedCorrectionIds } },
        data: { isApplied: true, appliedAt: new Date() },
      });
    }

    // Update review record status to REVISED
    await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        currentVersionNum: nextVersionNum,
        status: 'REVISED',
      },
    });

    // Re-run analysis on the revised content
    const analysis = await this.runAnalysis(reviewId, nextVersionNum, revisedContent, review.imageAttachmentUrl);

    // Audit log
    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId,
      entityType: 'REVIEW',
      entityId: reviewId,
      action: 'REVISED',
      details: {
        previousVersion: review.currentVersionNum,
        newVersion: nextVersionNum,
        newScore: analysis.overallScore,
        scoreDelta: analysis.overallScore - review.complianceScore,
      },
    });

    return {
      review: analysis.review,
      newVersionNum: nextVersionNum,
      analysis,
    };
  }
}
