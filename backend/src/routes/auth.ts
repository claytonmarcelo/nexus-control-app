import { Router } from 'express';
import { register, login, forgotPassword, resetPassword, refresh, me, logout } from '../controllers/authController.js';
import { validateRegister, validateLogin, validateForgotPassword, validateResetPassword, validateRefreshToken } from '../middleware/validation.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);
router.post('/refresh', validateRefreshToken, refresh);
router.get('/me', authenticate, me);
router.post('/logout', authenticate, logout);

export default router;
