import { ApprovalService } from '../services/approvalService';
import prisma from '../db';

describe('Review & Approval Workflow Authorization Tests', () => {
  let workspaceId: string;
  let creatorId: string;
  let reviewerId: string;
  let testReviewId: string;

  beforeAll(async () => {
    // Fetch seeded records
    const workspace = await prisma.workspace.findFirst();
    const creator = await prisma.user.findFirst({ where: { role: 'CREATOR' } });
    const reviewer = await prisma.user.findFirst({ where: { role: 'REVIEWER' } });

    if (!workspace || !creator || !reviewer) {
      throw new Error('Required demo fixtures missing from seed.');
    }

    workspaceId = workspace.id;
    creatorId = creator.id;
    reviewerId = reviewer.id;

    // Create a dedicated test review
    const review = await prisma.contentReview.create({
      data: {
        workspaceId,
        creatorId,
        title: 'Test Review for Authorization Workflow',
        contentType: 'BLOG',
        status: 'SUBMITTED',
        complianceScore: 95,
      },
    });

    testReviewId = review.id;
  });

  afterAll(async () => {
    if (testReviewId) {
      await prisma.contentReview.delete({ where: { id: testReviewId } }).catch(() => {});
    }
    await prisma.$disconnect();
  });

  test('Creator CANNOT approve their own content submissions', async () => {
    // Alex (Creator) attempts to approve their own review
    await expect(
      ApprovalService.approveReview(testReviewId, creatorId, 'CREATOR', 'Self-approval attempt')
    ).rejects.toThrow(/Unauthorized: Only Reviewers, Brand Managers, or Administrators have approval authority/);
  });

  test('User with Creator role cannot request changes or reject content', async () => {
    await expect(
      ApprovalService.requestChanges(testReviewId, creatorId, 'CREATOR', 'Should fail')
    ).rejects.toThrow(/Only Reviewers, Brand Managers, or Admins may request changes/);
  });

  test('Authorized Reviewer CAN approve compliant content without critical issues', async () => {
    const updated = await ApprovalService.approveReview(
      testReviewId,
      reviewerId,
      'REVIEWER',
      'All compliance checks passed.'
    );

    expect(updated.status).toBe('APPROVED');
    expect(updated.reviewerId).toBe(reviewerId);

    // Verify audit event and approval decision persisted
    const decision = await prisma.approvalDecision.findFirst({
      where: { reviewId: testReviewId, decision: 'APPROVED' },
    });
    expect(decision).toBeDefined();
    expect(decision?.decidedById).toBe(reviewerId);
  });
});
