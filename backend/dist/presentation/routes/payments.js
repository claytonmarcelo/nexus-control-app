import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { webhook, getPaymentStatus } from '../controllers/paymentController.js';
const router = express.Router();
// Notificação do gateway — SEM pública por natureza; protegida por HMAC (§51).
router.post('/webhook', webhook);
// Status do pagamento (dono do pedido ou staff), com reconsulta ao gateway.
router.get('/pedido/:id', authenticate, getPaymentStatus);
export default router;
