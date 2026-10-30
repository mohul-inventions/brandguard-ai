import crypto from 'crypto';
import { Request, Response } from 'express';
import prisma from '../db';
import { ReviewEngine } from '../services/reviewEngine';

export interface CMSWebhookPayload {
  platform: 'strapi' | 'hubspot' | 'contentful' | 'generic';
  contentId: string;
  title: string;
  content: string;
  authorEmail?: string;
  status?: string;
  workspaceSlug?: string;
}

/**
 * Validates HMAC SHA-256 signatures for incoming CMS webhooks.
 */
export function verifyWebhookSignature(
  rawBody: string | Buffer,
  signatureHeader: string | undefined,
  secretKey: string
): boolean {
  if (!signatureHeader || !secretKey) return false;
  try {
    const cleanHeader = signatureHeader.replace(/^sha256=/, '').trim();
    const computedHmac = crypto.createHmac('sha256', secretKey).update(rawBody).digest('hex');
    return crypto.timingSafeEqual(Buffer.from(cleanHeader, 'hex'), Buffer.from(computedHmac, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Extract normalized content payload from disparate CMS vendor schemas.
 */
export function normalizeCMSPayload(platform: string, body: any): CMSWebhookPayload {
  if (platform === 'strapi') {
    // Strapi webhook format: { event: 'entry.publish', model: 'article', entry: { id, title, content, ... } }
    const entry = body.entry || body;
    return {
      platform: 'strapi',
      contentId: String(entry.id || entry.documentId || 'strapi-entry'),
      title: entry.title || entry.name || 'Untitled Strapi Entry',
      content: entry.content || entry.body || entry.description || '',
      authorEmail: entry.author?.email,
      status: body.event || 'entry.publish',
    };
  }

  if (platform === 'hubspot') {
    // HubSpot webhook event payload: [{ subscriptionType: 'blog_post.creation', objectId: 12345, properties: {...} }]
    const item = Array.isArray(body) ? body[0] : body;
    const props = item.properties || item;
    return {
      platform: 'hubspot',
      contentId: String(item.objectId || props.id || 'hubspot-post'),
      title: props.post_body_title || props.name || props.title || 'Untitled HubSpot Post',
      content: props.post_body || props.content || props.message || '',
      authorEmail: props.author_email,
      status: item.subscriptionType || 'publish',
    };
  }

  if (platform === 'contentful') {
    // Contentful webhook format: { sys: { id, type }, fields: { title: { 'en-US': ... }, body: ... } }
    const fields = body.fields || {};
    const extractLocalized = (val: any) => {
      if (!val) return '';
      if (typeof val === 'object') {
        return val['en-US'] || Object.values(val)[0] || '';
      }
      return String(val);
    };

    return {
      platform: 'contentful',
      contentId: body.sys?.id || 'contentful-entry',
      title: extractLocalized(fields.title) || 'Untitled Contentful Entry',
      content: extractLocalized(fields.body || fields.content || fields.description),
      status: body.sys?.type || 'Entry',
    };
  }

  // Generic adapter fallback
  return {
    platform: 'generic',
    contentId: String(body.id || 'generic-entry'),
    title: body.title || 'Generic CMS Document',
    content: body.content || body.body || body.text || '',
    authorEmail: body.authorEmail,
    status: body.status || 'publish',
    workspaceSlug: body.workspaceSlug,
  };
}

/**
 * CMS Pre-Publish Webhook Gate Controller
 * Evaluates submitted content against workspace brand guidelines.
 * Returns HTTP 200 (ALLOW) or HTTP 422 (BLOCK) with detailed violation reports.
 */
export const handleCMSWebhook = async (req: Request, res: Response): Promise<void> => {
  try {
    const { platform } = req.params;
    const signature = (req.headers['x-hubspot-signature-v2'] ||
      req.headers['x-strapi-signature'] ||
      req.headers['x-contentful-signature'] ||
      req.headers['x-brandguard-signature']) as string | undefined;

    const webhookSecret = process.env.CMS_WEBHOOK_SECRET || 'brandguard-cms-webhook-secret-2026';

    // Verify webhook signature if present or if configured strictly
    if (process.env.ENFORCE_WEBHOOK_SIGNATURE === 'true') {
      const isValid = verifyWebhookSignature(JSON.stringify(req.body), signature, webhookSecret);
      if (!isValid) {
        res.status(401).json({
          decision: 'BLOCKED',
          error: 'Unauthorized: Invalid CMS webhook signature.',
        });
        return;
      }
    }

    const payload = normalizeCMSPayload(platform, req.body);

    if (!payload.content || payload.content.trim().length === 0) {
      res.status(400).json({
        decision: 'BLOCKED',
        error: 'Invalid request: No content detected in CMS payload to evaluate.',
      });
      return;
    }

    // Resolve workspace (fallback to default workspace if not supplied)
    let workspace = await prisma.workspace.findFirst({
      where: payload.workspaceSlug ? { slug: payload.workspaceSlug } : undefined,
    });
    if (!workspace) {
      workspace = await prisma.workspace.findFirst();
    }
    if (!workspace) {
      res.status(500).json({ error: 'No active workspace configured in BrandGuard.' });
      return;
    }

    // Resolve author or assign to workspace owner/first reviewer
    const reviewer = await prisma.user.findFirst({
      where: { role: { in: ['REVIEWER', 'ADMIN', 'BRAND_MANAGER'] } },
    });
    const creator = await prisma.user.findFirst({
      where: { role: 'CREATOR' },
    });
    const authorId = creator?.id || reviewer?.id || 'system-cms-gateway';

    // Submit and evaluate content via ReviewEngine
    const result = await ReviewEngine.submitAndAnalyze({
      workspaceId: workspace.id,
      creatorId: authorId,
      title: `[${platform.toUpperCase()} Pre-Publish] ${payload.title}`,
      contentType: 'BLOG',
      channel: `CMS:${platform.toUpperCase()}`,
      contentBody: payload.content,
      notes: `Ingested via Pre-Publish Webhook Gate for content ID: ${payload.contentId}`,
    });

    const minPublishScore = parseInt(process.env.CMS_MIN_PUBLISH_SCORE || '80', 10);
    const scoreSummary = result.analysisResult.scoreSummary;
    const hasCriticalIssues = scoreSummary.criticalCount > 0;
    const isApproved = result.analysisResult.overallScore >= minPublishScore && !hasCriticalIssues;

    if (!isApproved) {
      // Return HTTP 422 (Unprocessable Entity) to signal CMS gate to reject/block publishing
      res.status(422).json({
        decision: 'BLOCKED',
        reason: hasCriticalIssues
          ? `Publishing blocked due to ${scoreSummary.criticalCount} critical brand compliance violation(s).`
          : `Compliance score of ${result.analysisResult.overallScore}% is below required threshold of ${minPublishScore}%.`,
        reviewId: result.review.id,
        overallScore: result.analysisResult.overallScore,
        requiredThreshold: minPublishScore,
        criticalViolations: scoreSummary.criticalCount,
        highViolations: scoreSummary.highCount,
        violations: result.analysisResult.findings.map((f) => ({
          category: f.category,
          severity: f.severity,
          title: f.title,
          excerpt: f.excerpt,
          explanation: f.explanation,
          suggestedFix: f.suggestedCorrection,
        })),
        auditUrl: `/reviews/${result.review.id}`,
      });
      return;
    }

    // Allow publish
    res.status(200).json({
      decision: 'ALLOWED',
      status: 'PUBLISH_APPROVED',
      message: 'Content adheres to brand guidelines. Pre-publish gate check passed.',
      reviewId: result.review.id,
      overallScore: result.analysisResult.overallScore,
      requiredThreshold: minPublishScore,
      findingsCount: result.analysisResult.findings.length,
      auditUrl: `/reviews/${result.review.id}`,
    });
  } catch (err: any) {
    res.status(500).json({
      decision: 'BLOCKED',
      error: err.message || 'Internal error processing CMS pre-publish webhook gate.',
    });
  }
};
