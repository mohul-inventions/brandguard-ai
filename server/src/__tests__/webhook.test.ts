import { normalizeCMSPayload, verifyWebhookSignature } from '../controllers/webhookController';
import crypto from 'crypto';
import { DemoRuleEngineAdapter } from '../ai/adapter';
import { ScoringService } from '../services/scoringService';
import { BrandGuideline, ApprovedSource } from '@prisma/client';

describe('CMS Pre-Publish Webhook Gate Logic Tests', () => {
  const secretKey = 'test-cms-webhook-secret';

  test('HMAC SHA-256 signature verification functions correctly', () => {
    const rawPayload = JSON.stringify({ id: 'doc-123', content: 'Sample text' });
    const validSignature = crypto.createHmac('sha256', secretKey).update(rawPayload).digest('hex');

    expect(verifyWebhookSignature(rawPayload, validSignature, secretKey)).toBe(true);
    // Note: Replay protection correctly rejects re-submission of the identical payload:
    expect(verifyWebhookSignature(rawPayload, validSignature, secretKey)).toBe(false);
    expect(verifyWebhookSignature(JSON.stringify({ id: 'diff' }), 'invalid-signature-hex', secretKey)).toBe(false);
    expect(verifyWebhookSignature(rawPayload, undefined, secretKey)).toBe(false);
  });

  test('Strapi adapter normalizes payload correctly and evaluates critical brand naming violations', async () => {
    const strapiRaw = {
      event: 'entry.publish',
      model: 'article',
      entry: {
        id: 991,
        title: 'New Product Announcement',
        content: 'We are thrilled to announce Nova Tech is the #1 in the world cloud workspace!',
      },
    };

    const normalized = normalizeCMSPayload('strapi', strapiRaw);
    expect(normalized.platform).toBe('strapi');
    expect(normalized.contentId).toBe('991');
    expect(normalized.title).toBe('New Product Announcement');
    expect(normalized.content).toContain('Nova Tech');

    // Run through deterministic adapter with mock guidelines
    const mockGuidelines: BrandGuideline[] = [
      {
        id: 'g1',
        workspaceId: 'w1',
        title: 'Official Product Naming',
        category: 'TERMINOLOGY',
        severity: 'CRITICAL',
        description: 'Must always be NovaTech Pulse',
        ruleDetails: 'Never split into Nova Tech',
        examplesToAvoid: JSON.stringify(['Nova Tech']),
        preferredReplacements: JSON.stringify({ 'Nova Tech': 'NovaTech' }),
        isActive: true,
        version: 1,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'g2',
        workspaceId: 'w1',
        title: 'No Absolute Superlatives',
        category: 'PROMOTIONAL_CLAIMS',
        severity: 'CRITICAL',
        description: 'Prohibit unverified superlative claims',
        ruleDetails: 'Never say world number one',
        examplesToAvoid: JSON.stringify(['#1 in the world']),
        preferredReplacements: JSON.stringify({ '#1 in the world': 'a top-ranked' }),
        isActive: true,
        version: 1,
        authorId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const adapter = new DemoRuleEngineAdapter();
    const result = await adapter.analyze({
      content: normalized.content,
      contentType: 'BLOG',
      channel: 'CMS:STRAPI',
      guidelines: mockGuidelines,
      sources: [],
    });

    expect(result.criticalCount).toBeGreaterThanOrEqual(1);
    expect(result.overallScore).toBeLessThan(80);

    // Enforce pre-publish gate decision logic
    const minPublishScore = 80;
    const hasCritical = result.criticalCount > 0;
    const isApproved = result.overallScore >= minPublishScore && !hasCritical;
    expect(isApproved).toBe(false);
  });

  test('Contentful adapter normalizes localized payload and passes compliant content', async () => {
    const contentfulRaw = {
      sys: { id: 'entry-pass-1', type: 'Entry' },
      fields: {
        title: { 'en-US': 'Enterprise Security Overview' },
        body: { 'en-US': 'NovaTech Pulse delivers enterprise-grade collaboration and secure access for distributed teams.' },
      },
    };

    const normalized = normalizeCMSPayload('contentful', contentfulRaw);
    expect(normalized.platform).toBe('contentful');
    expect(normalized.contentId).toBe('entry-pass-1');
    expect(normalized.title).toBe('Enterprise Security Overview');

    const adapter = new DemoRuleEngineAdapter();
    const result = await adapter.analyze({
      content: normalized.content,
      contentType: 'BLOG',
      channel: 'CMS:CONTENTFUL',
      guidelines: [],
      sources: [],
    });

    const minPublishScore = 80;
    const isApproved = result.overallScore >= minPublishScore && result.criticalCount === 0;
    expect(isApproved).toBe(true);
    expect(result.overallScore).toBe(100);
  });

  test('HubSpot adapter normalizes nested properties format', () => {
    const hubspotRaw = {
      subscriptionType: 'blog_post.creation',
      objectId: 45678,
      properties: {
        post_body_title: 'HubSpot Inbound Article',
        post_body: 'Our latest release note.',
        author_email: 'author@novatech.io',
      },
    };

    const normalized = normalizeCMSPayload('hubspot', hubspotRaw);
    expect(normalized.platform).toBe('hubspot');
    expect(normalized.contentId).toBe('45678');
    expect(normalized.title).toBe('HubSpot Inbound Article');
    expect(normalized.content).toBe('Our latest release note.');
    expect(normalized.authorEmail).toBe('author@novatech.io');
  });
});
