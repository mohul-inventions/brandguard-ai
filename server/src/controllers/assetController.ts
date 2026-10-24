import { Request, Response } from 'express';
import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';

export const listAssets = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const { assetType, status } = req.query;

    const whereClause: any = { workspaceId };

    if (assetType && assetType !== 'ALL') {
      whereClause.assetType = assetType as string;
    }

    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }

    const assets = await prisma.brandAsset.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    res.json(assets);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list assets.' });
  }
};

export const createAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const userId = req.user?.id;

    if (!workspaceId) {
      res.status(401).json({ error: 'Workspace ID required.' });
      return;
    }

    const { name, assetType, description, usageRestrictions, metadataJson, status = 'APPROVED' } = req.body;
    let fileUrl: string | null = null;

    if (req.file) {
      fileUrl = `/uploads/${req.file.filename}`;
    }

    if (!name || !assetType || !description) {
      res.status(400).json({ error: 'Name, assetType, and description are required.' });
      return;
    }

    const asset = await prisma.brandAsset.create({
      data: {
        workspaceId,
        name,
        assetType,
        fileUrl,
        description,
        usageRestrictions,
        metadataJson: typeof metadataJson === 'string' ? metadataJson : JSON.stringify(metadataJson || {}),
        status,
      },
    });

    await recordAuditEvent({
      workspaceId,
      userId,
      entityType: 'ASSET',
      entityId: asset.id,
      action: 'CREATED',
      details: { name, assetType },
    });

    res.status(201).json(asset);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create brand asset.' });
  }
};

export const updateAssetStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { status, usageRestrictions } = req.body;

    const existing = await prisma.brandAsset.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    const updated = await prisma.brandAsset.update({
      where: { id },
      data: {
        status: status ?? existing.status,
        usageRestrictions: usageRestrictions ?? existing.usageRestrictions,
      },
    });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'ASSET',
      entityId: id,
      action: 'UPDATED',
      details: { status: updated.status },
    });

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update asset status.' });
  }
};

export const deleteAsset = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const existing = await prisma.brandAsset.findUnique({ where: { id } });
    if (!existing) {
      res.status(404).json({ error: 'Asset not found.' });
      return;
    }

    await prisma.brandAsset.delete({ where: { id } });

    await recordAuditEvent({
      workspaceId: existing.workspaceId,
      userId,
      entityType: 'ASSET',
      entityId: id,
      action: 'DELETED',
      details: { name: existing.name },
    });

    res.json({ success: true, message: 'Brand asset deleted.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to delete asset.' });
  }
};
