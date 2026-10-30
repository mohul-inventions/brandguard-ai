import { Router } from 'express';
import { register, login, demoLogin, getMe } from '../controllers/authController';
import { requireAuth } from '../middleware/auth';
import { rateLimiter } from '../middleware/security';

const router = Router();

const authLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000,
  maxRequests: 20,
  message: 'Too many authentication attempts. Please wait 15 minutes before trying again.',
});

router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/demo-login', demoLogin);
router.get('/me', requireAuth, getMe);

export default router;
