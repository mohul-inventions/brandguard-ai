import { Router } from 'express';
import { submitForReview, requestChanges, approveReview, rejectReview } from '../controllers/approvalController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.post('/:id/submit', requireAuth, submitForReview);
router.post('/:id/request-changes', requireAuth, requireRole(['REVIEWER', 'BRAND_MANAGER', 'ADMIN']), requestChanges);
router.post('/:id/approve', requireAuth, requireRole(['REVIEWER', 'BRAND_MANAGER', 'ADMIN']), approveReview);
router.post('/:id/reject', requireAuth, requireRole(['REVIEWER', 'BRAND_MANAGER', 'ADMIN']), rejectReview);

export default router;
