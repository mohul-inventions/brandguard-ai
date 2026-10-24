import { Router } from 'express';
import { register, login, demoLogin, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/demo-login', demoLogin);
router.get('/me', requireAuth, getMe);

export default router;
