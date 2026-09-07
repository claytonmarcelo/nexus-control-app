import { body, param, query, validationResult } from 'express-validator';

export const validateCheckout = [
  body('items').isArray().notEmpty().withMessage('items deve ser um array não vazio'),
  body('items.*.item_id').isInt({ min: 1 }).withMessage('item_id deve ser um inteiro positivo'),
  body('items.*.quantidade').isInt({ min: 1 }).withMessage('quantidade deve ser um inteiro positivo'),
  body('items.*.preco').isFloat({ min: 0 }).withMessage('preco deve ser um número positivo'),
  body('total').isFloat({ min: 0 }).withMessage('total deve ser um número positivo'),
  body('metodo_pagamento').isIn(['pix', 'cartao']).withMessage('metodo_pagamento deve ser pix ou cartao'),
  handleValidationErrors
];

export const validateOrderId = [
  param('id').isInt({ min: 1 }).withMessage('id deve ser um inteiro positivo'),
  handleValidationErrors
];

export const validatePagination = [
  query('page').optional().isInt({ min: 1 }).withMessage('page deve ser um inteiro positivo'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('limit deve estar entre 1 e 100'),
  handleValidationErrors
];

export const validateUpdateOrderStatus = [
  param('id').isInt({ min: 1 }).withMessage('id deve ser um inteiro positivo'),
  body('status_pagamento').optional().isIn(['pendente', 'confirmado', 'cancelado', 'falha']).withMessage('status_pagamento inválido'),
  handleValidationErrors
];

function handleValidationErrors(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Erro de validação',
      errors: errors.array(),
      timestamp: new Date().toISOString()
    });
  }
  next();
}
