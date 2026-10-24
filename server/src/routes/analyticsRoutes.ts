import { Router } from 'express';
import { getAnalyticsOverview } from '../controllers/analyticsController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/overview', requireAuth, getAnalyticsOverview);

export default router;
