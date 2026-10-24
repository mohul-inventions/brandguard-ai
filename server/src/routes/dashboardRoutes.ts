import { Router } from 'express';
import { getDashboardSummary } from '../controllers/dashboardController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.get('/summary', requireAuth, getDashboardSummary);

export default router;
