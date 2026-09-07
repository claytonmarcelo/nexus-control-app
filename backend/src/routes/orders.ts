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
  deleteOrderById
} from '../controllers/orderController.js';

const router = express.Router();

// Rotas públicas (requerem autenticação)
router.post('/checkout', authenticate, validateCheckout, checkout);
router.get('/me', authenticate, validatePagination, getUserOrders);
router.get('/:id', authenticate, validateOrderId, getOrderById);

// Rotas admin
router.get('/', authenticate, authorize('admin'), validatePagination, getAllOrders);
router.put('/:id', authenticate, authorize('admin'), validateUpdateOrderStatus, updateOrder);
router.delete('/:id', authenticate, authorize('admin'), validateOrderId, deleteOrderById);

export default router;
