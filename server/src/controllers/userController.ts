import { Request, Response } from 'express';
import prisma from '../db';
import { recordAuditEvent } from '../utils/audit';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaceId = req.user?.workspaceId;
    const users = await prisma.user.findMany({
      where: { memberships: { some: { workspaceId } } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatarUrl: true,
        createdAt: true,
        _count: {
          select: {
            createdReviews: true,
            assignedReviews: true,
            approvalDecisions: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json(users);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to list users.' });
  }
};

export const updateUserRole = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    const adminId = req.user?.id;
    const workspaceId = req.user?.workspaceId;

    if (!['CREATOR', 'BRAND_MANAGER', 'REVIEWER', 'ADMIN'].includes(role)) {
      res.status(400).json({ error: 'Invalid role specified.' });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, name: true, email: true, role: true },
    });

    if (workspaceId) {
      await prisma.workspaceMembership.updateMany({
        where: { userId: id, workspaceId },
        data: { role },
      });

      await recordAuditEvent({
        workspaceId,
        userId: adminId,
        entityType: 'USER',
        entityId: id,
        action: 'ROLE_UPDATED',
        details: { newRole: role, targetUser: updatedUser.email },
      });
    }

    res.json(updatedUser);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update user role.' });
  }
};
