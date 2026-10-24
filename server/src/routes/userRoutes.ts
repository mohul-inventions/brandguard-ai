import { Router } from 'express';
import { listUsers, updateUserRole } from '../controllers/userController';
import { requireAuth, requireRole } from '../middleware/auth';

const router = Router();

router.get('/', requireAuth, listUsers);
router.patch('/:id/role', requireAuth, requireRole(['ADMIN']), updateUserRole);

export default router;
