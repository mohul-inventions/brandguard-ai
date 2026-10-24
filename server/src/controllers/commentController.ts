import { Request, Response } from 'express';
import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';

export const listComments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const comments = await prisma.comment.findMany({
      where: { reviewId: id, parentId: null },
      include: {
        author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
        replies: {
          include: {
            author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    res.json(comments);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list comments.' });
  }
};

export const createComment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const authorId = req.user?.id;
    const { content, parentId } = req.body;

    if (!authorId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!content || content.trim().length === 0) {
      res.status(400).json({ error: 'Comment content cannot be empty.' });
      return;
    }

    const review = await prisma.contentReview.findUnique({
      where: { id },
      include: { creator: true },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    const comment = await prisma.comment.create({
      data: {
        reviewId: id,
        authorId,
        parentId: parentId || null,
        content,
      },
      include: {
        author: { select: { id: true, name: true, email: true, role: true, avatarUrl: true } },
      },
    });

    // Notify author if comment made by another user
    if (review.creatorId !== authorId) {
      await prisma.notification.create({
        data: {
          userId: review.creatorId,
          title: 'New Feedback on Your Review',
          message: `${req.user?.name} commented: "${content.substring(0, 60)}..."`,
          link: `/reviews/${review.id}`,
        },
      });
    }

    await recordAuditEvent({
      workspaceId: review.workspaceId,
      userId: authorId,
      entityType: 'REVIEW',
      entityId: id,
      action: 'COMMENTED',
      details: { commentId: comment.id, isReply: !!parentId },
    });

    res.status(201).json(comment);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create comment.' });
  }
};
