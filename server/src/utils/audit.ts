import prisma from '../db';

export interface AuditParams {
  workspaceId: string;
  userId?: string;
  entityType: 'REVIEW' | 'GUIDELINE' | 'SOURCE' | 'ASSET' | 'USER' | 'APPROVAL';
  entityId: string;
  action: string;
  details?: Record<string, any>;
  ipAddress?: string;
}

export const recordAuditEvent = async (params: AuditParams) => {
  try {
    return await prisma.auditEvent.create({
      data: {
        workspaceId: params.workspaceId,
        userId: params.userId || null,
        entityType: params.entityType,
        entityId: params.entityId,
        action: params.action,
        detailsJson: params.details ? JSON.stringify(params.details) : null,
        ipAddress: params.ipAddress || null,
      },
    });
  } catch (err) {
    console.error('Failed to log audit event:', err);
    return null;
  }
};
