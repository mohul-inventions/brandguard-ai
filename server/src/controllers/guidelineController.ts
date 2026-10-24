import { Request, Response } from 'express';
import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';

export const listGuidelines = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { category, severity, active, search } = req.query;

    const whereClause: any = { workspaceId };

    if (category && category !== 'ALL') {
      whereClause.category = category as string;
    }

    if (severity && severity !== 'ALL') {
      whereClause.severity = severity as string;
    }

    if (active !== undefined && active !== 'ALL') {
      whereClause.isActive = active === 'true';
    }

    if (search && typeof search === 'string') {
      whereClause.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { ruleDetails: { contains: search } },
      ];
    }

    const guidelines = await prisma.brandGuideline.findMany({
      where: whereClause,
      orderBy: [{ severity: 'asc' }, { updatedAt: 'desc' }],
      include: {
        versions: { orderBy: { version: 'desc' }, take: 1 },
      },
    });

    res.json(guidelines);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list guidelines.' });
  }
};

export const getGuidelineById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const guideline = await prisma.brandGuideline.findUnique({
      where: { id },
      include: {
        versions: {
          include: { changedBy: { select: { name: true, email: true, role: true } } },
          orderBy: { version: 'desc' },
        },
      },
    });

    if (!guideline) {
      res.status(404).json({ error: 'Guideline not found.' });
      return;
    }

    res.json(guideline);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to get guideline.' });
  }
};

export const createGuideline = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const authorId = req.user?.id;

    if (!workspaceId) {
      res.status(401).json({ error: 'Workspace ID required.' });
      return;
    }

    const {
      title,
      category,
      severity,
      description,
      ruleDetails,
      examplesToAvoid,
      preferredReplacements,
      isActive = true,
    } = req.body;

    if (!title || !category || !severity || !description || !ruleDetails) {
      res.status(400).json({ error: 'Title, category, severity, description, and ruleDetails are required.' });
      return;
    }

    const guideline = await prisma.brandGuideline.create({
      data: {
        workspaceId,
        title,
        category,
        severity,
        description,
        ruleDetails,
        examplesToAvoid: typeof examplesToAvoid === 'string' ? examplesToAvoid : JSON.stringify(examplesToAvoid || []),
        preferredReplacements:
          typeof preferredReplacements === 'string'
            ? preferredReplacements
            : JSON.stringify(preferredReplacements || {}),
        isActive,
        version: 1,
        authorId,
      },
    });

    // Create Version 1 record
    await prisma.guidelineVersion.create({
      data: {
        guidelineId: guideline.id,
        version: 1,
        changeSummary: 'Initial guideline creation',
        ruleDetails,
        changedById: authorId,
      },
    });

    await recordAuditEvent({
      workspaceId,
      userId: authorId,
      entityType: 'GUIDELINE',
      entityId: guideline.id,
      action: 'CREATED',
      details: { title, category, severity },
    });

    res.status(201).json(guideline);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create guideline.' });
  }
};

export const updateGuideline = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const {
      title,
      category,
      severity,
      description,
      ruleDetails,
      examplesToAvoid,
      preferredReplacements,
      isActive,
      changeSummary,
    } = req.body;

    const existing = await prisma.brandGuideline.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Guideline not found.' });
      return;
    }

    const newVersionNum = existing.version + 1;

    const updated = await prisma.brandGuideline.update({
      where: { id },
      data: {
        title: title ?? existing.title,
        category: category ?? existing.category,
        severity: severity ?? existing.severity,
        description: description ?? existing.description,
        ruleDetails: ruleDetails ?? existing.ruleDetails,
        examplesToAvoid:
          examplesToAvoid !== undefined
            ? typeof examplesToAvoid === 'string'
              ? examplesToAvoid
              : JSON.stringify(examplesToAvoid)
            : existing.examplesToAvoid,
        preferredReplacements:
          preferredReplacements !== undefined
            ? typeof preferredReplacements === 'string'
              ? preferredReplacements
              : JSON.stringify(preferredReplacements)
            : existing.preferredReplacements,
        isActive: isActive !== undefined ? isActive : existing.isActive,
        version: newVersionNum,
      },
    });

    // Create GuidelineVersion history entry
    await prisma.guidelineVersion.create({
      data: {
        guidelineId: id,
        version: newVersionNum,
        changeSummary: changeSummary || `Updated rule definition to v${newVersionNum}`,
        ruleDetails: updated.ruleDetails,
        changedById: userId,
      },
    });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'GUIDELINE',
      entityId: id,
      action: 'UPDATED',
      details: { version: newVersionNum, changeSummary },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update guideline.' });
  }
};

export const toggleGuidelineActive = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.brandGuideline.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Guideline not found.' });
      return;
    }

    const updated = await prisma.brandGuideline.update({
      where: { id },
      data: { isActive: !existing.isActive },
    });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'GUIDELINE',
      entityId: id,
      action: updated.isActive ? 'ACTIVATED' : 'DEACTIVATED',
      details: { isActive: updated.isActive },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to toggle guideline state.' });
  }
};
