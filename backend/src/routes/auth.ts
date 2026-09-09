import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { register, login, forgotPassword, resetPassword, refresh, me, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateRefreshToken } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Rate limiter específico para login: 10 tentativas a cada 15 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // máximo de 10 tentativas
  message: 'Muitas tentativas de login. Tente novamente em 15 minutos.',
  standardHeaders: true, // Retorna info de rate limit nos headers `RateLimit-*`
  legacyHeaders: false, // Desativa headers `X-RateLimit-*`
  skip: (req) => {
    // Aplicar apenas a requisições POST
    return req.method !== 'POST';
  }
});

router.post('/register', validateRegister, register);
router.post('/login', loginLimiter, validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/refresh', validateRefreshToken, refresh);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
