import { Request, Response } from 'express';
import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';

export const listSources = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { sourceType, status, search } = req.query;

    const whereClause: any = { workspaceId };

    if (sourceType && sourceType !== 'ALL') {
      whereClause.sourceType = sourceType as string;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { content: { contains: search } },
        { owner: { contains: search } },
      ];
    }

    const sources = await prisma.approvedSource.findMany({
      where: whereClause,
      orderBy: { updatedAt: 'desc' },
      include: {
        _count: { select: { findings: true } },
      },
    });

    res.json(sources);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list approved sources.' });
  }
};

export const createSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const userId = req.user?.id;

    if (!workspaceId) {
      res.status(401).json({ error: 'Workspace ID required.' });
      return;
    }

    const { title, sourceType, content, referenceUrl, owner, expirationDate, status = 'ACTIVE' } = req.body;

    if (!title || !sourceType || !content || !owner) {
      res.status(400).json({ error: 'Title, sourceType, content, and owner are required fields.' });
      return;
    }

    const source = await prisma.approvedSource.create({
      data: {
        workspaceId,
        title,
        sourceType,
        content,
        referenceUrl,
        owner,
        expirationDate: expirationDate ? new Date(expirationDate) : null,
        status,
      },
    });

    await recordAuditEvent({
      workspaceId,
      userId,
      entityType: 'SOURCE',
      entityId: source.id,
      action: 'CREATED',
      details: { title, sourceType },
    });

    res.status(201).json(source);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create approved source.' });
  }
};

export const updateSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { title, sourceType, content, referenceUrl, owner, expirationDate, status } = req.body;

    const existing = await prisma.approvedSource.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Approved source not found.' });
      return;
    }

    const updated = await prisma.approvedSource.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        sourceType: sourceType ?? existing.sourceType,
        content: content ?? existing.content,
        referenceUrl: referenceUrl ?? existing.referenceUrl,
        owner: owner ?? existing.owner,
        expirationDate: expirationDate !== undefined ? (expirationDate ? new Date(expirationDate) : null) : existing.expirationDate,
        status: status ?? existing.status,
      },
    });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'SOURCE',
      entityId: id,
      action: 'UPDATED',
      details: { title: updated.title, status: updated.status },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update approved source.' });
  }
};

export const deleteSource = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.approvedSource.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Approved source not found.' });
      return;
    }

    await prisma.approvedSource.delete({ where: { id } });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'SOURCE',
      entityId: id,
      action: 'DELETED',
      details: { title: existing.title },
    });

    res.json({ success: true, message: 'Approved source deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete source.' });
  }
};
