import { Router } from 'express';
import { updateFindingStatus, applyCorrection } from '../controllers/findingController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.patch('/:id', requireAuth, updateFindingStatus);
router.post('/:id/apply-correction', requireAuth, applyCorrection);

export default router;
