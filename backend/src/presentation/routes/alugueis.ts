import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendError } from '../../utils/response.js';
import {
  createRegularizationOrder,
  getMyRentals,
  getRentalsForOperation,
  updatePickupStatus,
} from '../controllers/aluguelController.js';

const router = express.Router();

const validateAluguelId = (req: any, res: any, next: any) => {
  if (!/^\d+$/.test(String(req.params.id || ''))) {
    return sendError(res, 'ID de aluguel inválido', 400);
  }
  next();
};

router.use(authenticate);

// Visão do cliente (inclui histórico de contas vinculadas)
router.get('/me', getMyRentals);

// Visão operacional — admin e funcionário (controle de vencidos/retirada)
router.get('/operacao', authorize('admin', 'funcionario'), getRentalsForOperation);

// Regularização de dias excedentes: cria pedido de pagamento via checkout existente
router.post('/:id/regularizacao', validateAluguelId, createRegularizationOrder);

// Retirada/devolução do equipamento — apenas staff
router.put('/:id/retirada', authorize('admin', 'funcionario'), validateAluguelId, updatePickupStatus);

export default router;
