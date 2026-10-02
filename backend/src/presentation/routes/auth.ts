import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, forgotPassword, resetPassword, refresh, me, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateRefreshToken } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rate limiter específico para login
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test' ? 1000 : 30,
  skipSuccessfulRequests: true,
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desativa headers `X-RateLimit-*`
  skip: (req) => {
    // Aplicar apenas a requisições POST
    return req.method !== 'POST';
  }
});

const passwordResetRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Muitas solicitações de recuperação. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: 'Muitas tentativas de redefinição. Tente novamente mais tarde.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/forgot-password', passwordResetRequestLimiter, validateForgotPassword, forgotPassword);
router.post('/reset-password', passwordResetLimiter, validateResetPassword, resetPassword);
router.post('/refresh', validateRefreshToken, refresh);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
