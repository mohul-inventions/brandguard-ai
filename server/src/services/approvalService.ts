import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';
import { UserRole } from '../types';

export class ApprovalService {
  /**
   * Submit draft review for formal review
   */
  static async submitReview(reviewId: string, userId: string) {
    const review = await prisma.contentReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');

    const updated = await prisma.contentReview.update({
      where: { id: reviewId },
      data: { status: 'SUBMITTED' },
    });

    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId,
      entityType: 'REVIEW',
      entityId: review.id,
      action: 'SUBMITTED',
      details: { status: 'SUBMITTED' },
    });

    return updated;
  }

  /**
   * Request changes (Reviewer / Brand Manager / Admin)
   */
  static async requestChanges(reviewId: string, userId: string, userRole: UserRole, reason: string) {
    if (!['REVIEWER', 'BRAND_MANAGER', 'ADMIN'].includes(userRole)) {
      throw new Error('Only Reviewers, Brand Managers, or Admins may request changes on reviews.');
    }

    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
      include: { creator: true },
    });
    if (!review) throw new Error('Review not found');

    const updated = await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        status: 'CHANGES_REQUESTED',
        reviewerId: userId,
      },
    });

    // Record approval decision
    await prisma.approvalDecision.create({
      data: {
        reviewId,
        decidedById: userId,
        decision: 'CHANGES_REQUESTED',
        reason,
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: review.creatorId,
        title: 'Changes Requested on Your Review',
        message: `Changes requested on "${review.title}": ${reason}`,
        link: `/reviews/${review.id}`,
      },
    });

    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId,
      entityType: 'APPROVAL',
      entityId: review.id,
      action: 'CHANGES_REQUESTED',
      details: { reason },
    });

    return updated;
  }

  /**
   * Approve content for publication (Reviewer / Brand Manager / Admin)
   * Rule: Creator CANNOT approve their own content!
   */
  static async approveReview(reviewId: string, userId: string, userRole: UserRole, reason?: string) {
    const review = await prisma.contentReview.findUnique({
      where: { id: reviewId },
      include: { findings: { where: { status: 'OPEN', severity: 'CRITICAL' } } },
    });
    if (!review) throw new Error('Review not found');

    // Role verification
    if (!['REVIEWER', 'BRAND_MANAGER', 'ADMIN'].includes(userRole)) {
      throw new Error('Unauthorized: Only Reviewers, Brand Managers, or Administrators have approval authority.');
    }

    // Strict Segregation of Duties: Creator cannot approve their own review!
    if (review.creatorId === userId) {
      throw new Error('Policy Violation: Creators are strictly prohibited from approving their own content submissions.');
    }

    // Guard: Critical unresolved issues check
    if (review.findings.length > 0) {
      throw new Error(`Cannot approve review while ${review.findings.length} critical unresolved issue(s) remain.`);
    }

    const updated = await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        status: 'APPROVED',
        reviewerId: userId,
      },
    });

    await prisma.approvalDecision.create({
      data: {
        reviewId,
        decidedById: userId,
        decision: 'APPROVED',
        reason: reason || 'Approved for publication based on brand compliance standards.',
      },
    });

    // Notify creator
    await prisma.notification.create({
      data: {
        userId: review.creatorId,
        title: 'Content Approved for Publication!',
        message: `Your content "${review.title}" has been approved by reviewer.`,
        link: `/reviews/${review.id}`,
      },
    });

    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId,
      entityType: 'APPROVAL',
      entityId: review.id,
      action: 'APPROVED',
      details: { score: review.complianceScore, reason },
    });

    return updated;
  }

  /**
   * Reject review with explicit reason
   */
  static async rejectReview(reviewId: string, userId: string, userRole: UserRole, reason: string) {
    if (!['REVIEWER', 'BRAND_MANAGER', 'ADMIN'].includes(userRole)) {
      throw new Error('Unauthorized: Only Reviewers, Brand Managers, or Admins may reject reviews.');
    }

    if (!reason || reason.trim().length === 0) {
      throw new Error('A detailed reason is required to reject a content submission.');
    }

    const review = await prisma.contentReview.findUnique({ where: { id: reviewId } });
    if (!review) throw new Error('Review not found');

    const updated = await prisma.contentReview.update({
      where: { id: reviewId },
      data: {
        status: 'REJECTED',
        reviewerId: userId,
      },
    });

    await prisma.approvalDecision.create({
      data: {
        reviewId,
        decidedById: userId,
        decision: 'REJECTED',
        reason,
      },
    });

    await prisma.notification.create({
      data: {
        userId: review.creatorId,
        title: 'Review Rejected',
        message: `Review "${review.title}" was rejected: ${reason}`,
        link: `/reviews/${review.id}`,
      },
    });

    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId,
      entityType: 'APPROVAL',
      entityId: review.id,
      action: 'REJECTED',
      details: { reason },
    });

    return updated;
  }
}
