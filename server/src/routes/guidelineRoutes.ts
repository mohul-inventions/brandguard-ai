import { Router } from 'express';
import {
  listGuidelines,
  getGuidelineById,
  createGuideline,
  updateGuideline,
  toggleGuidelineActive,
} from '../controllers/guidelineController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listGuidelines);
router.get('/:id', requireAuth, getGuidelineById);
router.post('/', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), createGuideline);
router.patch('/:id', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), updateGuideline);
router.patch('/:id/toggle-active', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), toggleGuidelineActive);

export default router;
