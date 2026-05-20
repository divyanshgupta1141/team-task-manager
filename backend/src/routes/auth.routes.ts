import { Router } from 'express';
import { signup, login, getMe } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { authLimiter } from '../middleware/limiter';

const router = Router();

router.post('/signup', authLimiter, signup);
router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);

export default router;
