import { Request, Response } from 'express';
import prisma from '../db';
import { getAIProvider } from '../ai/adapter';

/**
 * Ephemeral Real-Time Content Evaluation
 * Evaluates raw text directly against active brand guidelines and sources
 * WITHOUT persisting database review records. Ideal for real-time Chrome Extensions.
 */
export const checkContentEphemeral = async (req: Request, res: Response): Promise<void> => {
  try {
    const { content, contentType, channel, targetAudience, workspaceId: bodyWsId } = req.body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      res.status(400).json({ error: 'Content string is required for compliance evaluation.' });
      return;
    }

    // Determine target workspace: user workspace > explicit body workspaceId > first active workspace
    const workspaceId = req.user?.workspaceId || bodyWsId;
    let workspace;
    if (workspaceId) {
      workspace = await prisma.workspace.findUnique({ where: { id: workspaceId } });
    }
    if (!workspace) {
      workspace = await prisma.workspace.findFirst();
    }
    if (!workspace) {
      res.status(404).json({ error: 'No active workspace found for compliance evaluation.' });
      return;
    }

    // Load active guidelines and sources
    const guidelines = await prisma.brandGuideline.findMany({
      where: { workspaceId: workspace.id, isActive: true },
    });

    const sources = await prisma.approvedSource.findMany({
      where: { workspaceId: workspace.id, status: 'ACTIVE' },
    });

    // Run compliance evaluation via configured adapter (with local semantic engine)
    const provider = getAIProvider();
    const result = await provider.analyze({
      content,
      contentType: contentType || 'OTHER',
      channel: channel || 'BROWSER_EXTENSION',
      targetAudience,
      guidelines,
      sources,
      enableSemanticAnalysis: true,
    });

    res.json({
      workspace: {
        id: workspace.id,
        name: workspace.name,
      },
      overallScore: result.overallScore,
      criticalCount: result.criticalCount,
      highCount: result.highCount,
      mediumCount: result.mediumCount,
      lowCount: result.lowCount,
      findings: result.findings,
      categoryScores: result.categoryScores,
      engineUsed: result.engineUsed,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error executing ephemeral content check.' });
  }
};
