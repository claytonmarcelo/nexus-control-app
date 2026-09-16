import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateCheckout,
  validateOrderId,
  validatePagination,
  validateUpdateOrderStatus
} from '../middleware/orderValidation.js';
import {
  checkout,
  getOrderById,
  getUserOrders,
  getAllOrders,
  updateOrder,
  deleteOrderById,
  getUserOrdersByAdmin
} from '../controllers/orderController.js';

const router = express.Router();

// Rotas públicas (requerem autenticação)
router.post('/checkout', authenticate, validateCheckout, checkout);
router.get('/me', authenticate, validatePagination, getUserOrders);

// Rotas admin
router.get('/', authenticate, authorize('admin'), validatePagination, getAllOrders);
router.get('/user/:userId', authenticate, authorize('admin'), validatePagination, getUserOrdersByAdmin);

// Rota por ID (deve ficar após rotas com subcaminhos)
router.get('/:id', authenticate, validateOrderId, getOrderById);
router.put('/:id', authenticate, authorize('admin'), validateUpdateOrderStatus, updateOrder);

// Compartilhado (dono ou admin)
router.delete('/:id', authenticate, validateOrderId, deleteOrderById);

export default router;