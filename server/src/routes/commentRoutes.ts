import { Router } from 'express';
import { listComments, createComment } from '../controllers/commentController';
import { requireAuth } from '../middleware/auth';

const router = Router({ mergeParams: true });

router.get('/', requireAuth, listComments);
router.post('/', requireAuth, createComment);

export default router;
