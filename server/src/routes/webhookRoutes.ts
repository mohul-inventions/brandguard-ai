import { Router } from 'express';
import { handleCMSWebhook } from '../controllers/webhookController';

const router = Router();

// CMS Pre-Publish Webhook Gate Route
// Supports :platform = strapi | hubspot | contentful | generic
router.post('/cms/:platform', handleCMSWebhook);

export default router;
