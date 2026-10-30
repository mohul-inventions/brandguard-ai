import { Router } from 'express';
import {
  listReviews,
  getReviewById,
  createReview,
  reviseReview,
  reanalyzeReview,
  getReviewHistory,
} from '../controllers/reviewController';
import { checkContentEphemeral } from '../controllers/ephemeralCheckController';
import { requireAuth } from '../middleware/auth';
import { upload } from '../middleware/upload';

const router = Router();

// Ephemeral real-time scan endpoint (authenticated or demo pass)
router.post('/check-ephemeral', requireAuth, checkContentEphemeral);

router.get('/', requireAuth, listReviews);
router.get('/:id', requireAuth, getReviewById);
router.post(
  '/',
  requireAuth,
  upload.fields([
    { name: 'document', maxCount: 1 },
    { name: 'image', maxCount: 1 },
  ]),
  createReview
);
router.post('/:id/revise', requireAuth, reviseReview);
router.post('/:id/analyze', requireAuth, reanalyzeReview);
router.get('/:id/history', requireAuth, getReviewHistory);

export default router;
