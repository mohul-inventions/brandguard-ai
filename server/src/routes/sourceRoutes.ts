import { Router } from 'express';
import { listSources, createSource, updateSource, deleteSource } from '../controllers/sourceController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listSources);
router.post('/', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), createSource);
router.patch('/:id', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), updateSource);
router.delete('/:id', requireAuth, requireRole(['BRAND_MANAGER', 'ADMIN']), deleteSource);

export default router;
