import { Request, Response } from 'express';
import prisma from '../db';
import { ReviewEngine } from '../services/reviewEngine';
import { extractFileText } from '../utils/fileExtract';
import { ContentType } from '../types';

export const listReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { status, contentType, search } = req.query;

    const whereClause: any = { workspaceId };

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    if (contentType && contentType !== 'ALL') {
      whereClause.contentType = contentType as string;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { targetAudience: { contains: search } },
        { channel: { contains: search } },
      ];
    }

    const reviews = await prisma.contentReview.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true } },
        reviewer: { select: { id: true, name: true, email: true, avatarUrl: true } },
        _count: {
          select: { findings: true, comments: true, versions: true },
        },
      },
    });

    res.json(reviews);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list reviews.' });
  }
};

export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const versionNum = req.query.version ? parseInt(req.query.version as string, 10) : undefined;

    const review = await prisma.contentReview.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        reviewer: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
        versions: { orderBy: { versionNum: 'asc' } },
        findings: {
          include: {
            guideline: true,
            source: true,
            suggestedCorrections: true,
          },
          orderBy: { severity: 'asc' },
        },
        comments: {
          include: {
            author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
            replies: {
              include: {
                author: { select: { id: true, name: true, email: true, avatarUrl: true, role: true } },
              },
            },
          },
          where: { parentId: null },
          orderBy: { createdAt: 'asc' },
        },
        approvalDecisions: {
          include: {
            decidedBy: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!review) {
      res.status(404).json({ error: 'Review not found.' });
      return;
    }

    const targetVersionNum = versionNum || review.currentVersionNum;
    const activeVersion = review.versions.find((v) => v.versionNum === targetVersionNum) || review.versions[0];
    const activeFindings = review.findings.filter((f) => f.versionNum === targetVersionNum);

    res.json({
      ...review,
      activeVersion,
      activeFindings,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to retrieve review.' });
  }
};

export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const creatorId = req.user?.id;

    if (!workspaceId || !creatorId) {
      res.status(401).json({ error: 'Unauthorized. Workspace or User missing.' });
      return;
    }

    const { title, contentType, targetAudience, channel, notes } = req.body;
    let contentBody = req.body.contentBody || '';
    let imageAttachmentUrl: string | undefined = undefined;

    // Handle files if uploaded via multer
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | Express.Multer.File[] | undefined;

    if (files) {
      if (Array.isArray(files)) {
        for (const file of files) {
          if (file.mimetype.startsWith('image/')) {
            imageAttachmentUrl = `/uploads/${file.filename}`;
          } else {
            const extracted = await extractFileText(file.path, file.originalname);
            contentBody = extracted.text;
          }
        }
      } else {
        if (files['document'] && files['document'][0]) {
          const docFile = files['document'][0];
          const extracted = await extractFileText(docFile.path, docFile.originalname);
          contentBody = extracted.text;
        }
        if (files['image'] && files['image'][0]) {
          const imgFile = files['image'][0];
          imageAttachmentUrl = `/uploads/${imgFile.filename}`;
        }
      }
    }

    if (!title || !contentType) {
      res.status(400).json({ error: 'Title and contentType are required fields.' });
      return;
    }

    if (!contentBody || contentBody.trim().length === 0) {
      res.status(400).json({ error: 'Content body is required. Please type content or upload a document.' });
      return;
    }

    const result = await ReviewEngine.submitAndAnalyze({
      workspaceId,
      creatorId,
      title,
      contentType: contentType as ContentType,
      targetAudience,
      channel,
      contentBody,
      imageAttachmentUrl,
      notes,
    });

    res.status(201).json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create and analyze review.' });
  }
};

export const reviseReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { revisedContent, summaryOfChanges, appliedCorrectionIds } = req.body;

    if (!userId) {
      res.status(401).json({ error: 'Unauthorized.' });
      return;
    }

    if (!revisedContent || revisedContent.trim().length === 0) {
      res.status(400).json({ error: 'Revised content cannot be empty.' });
      return;
    }

    const result = await ReviewEngine.saveRevision(
      id,
      userId,
      revisedContent,
      summaryOfChanges,
      appliedCorrectionIds || []
    );

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to revise review.' });
  }
};

export const reanalyzeReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const review = await prisma.contentReview.findUnique({
      where: { id },
      include: { versions: { orderBy: { versionNum: 'desc' }, take: 1 } },
    });

    if (!review || review.versions.length === 0) {
      res.status(404).json({ error: 'Review or content version not found.' });
      return;
    }

    const latest = review.versions[0];
    const result = await ReviewEngine.runAnalysis(id, latest.versionNum, latest.contentBody, review.imageAttachmentUrl);

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to re-analyze review.' });
  }
};

export const getReviewHistory = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const versions = await prisma.contentVersion.findMany({
      where: { reviewId: id },
      include: {
        createdBy: { select: { name: true, email: true, role: true } },
      },
      orderBy: { versionNum: 'asc' },
    });

    const auditTrail = await prisma.auditEvent.findMany({
      where: { entityId: id, entityType: { in: ['REVIEW', 'APPROVAL'] } },
      include: {
        user: { select: { name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      versions,
      auditTrail,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch review history.' });
  }
};
