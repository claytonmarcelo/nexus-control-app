import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../../infrastructure/utils/response.js';

export const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Dados inválidos', 400, errors.array());
  }
  next();
};

export const validateCheckout = [
  body('items')
    .isArray({ min: 1 }).withMessage('Carrinho deve conter pelo menos um item'),
  body('items.*.item_id')
    .isInt({ min: 1 }).withMessage('ID do item inválido'),
  body('items.*.quantidade')
    .isInt({ min: 1 }).withMessage('Quantidade deve ser positiva'),
  body('items.*.nome')
    .optional()
    .trim()
    .notEmpty().withMessage('Nome do item não pode estar vazio'),
  body('metodo_pagamento')
    .optional()
    .isIn(['cartao', 'pix', 'boleto']).withMessage('Método de pagamento inválido'),
  handleValidationErrors
];

export const validateOrderId = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID do pedido inválido'),
  handleValidationErrors
];

export const validateUpdateOrderStatus = [
  param('id')
    .isInt({ min: 1 }).withMessage('ID do pedido inválido'),
  body('status_pagamento')
    .optional()
    // Exatamente o ENUM do banco (migrate.js): evita 500 por valor truncado.
    .isIn(['pendente', 'processando', 'confirmado', 'recusado', 'cancelado', 'falha', 'estornado']).withMessage('Status de pagamento inválido'),
  body('status_pedido')
    .optional()
    .isIn(['novo', 'processando', 'concluido', 'cancelado']).withMessage('Status do pedido inválido'),
  body('metodo_pagamento')
    .optional()
    .isIn(['cartao', 'pix']).withMessage('Método de pagamento inválido'),
  body()
    .custom((value, { req }) => {
      const { status_pagamento, status_pedido, metodo_pagamento } = req.body || {};
      if (status_pagamento === undefined && status_pedido === undefined && metodo_pagamento === undefined) {
        throw new Error('Informe ao menos um status para atualização');
      }
      return true;
    }),
  handleValidationErrors
];

export const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Página deve ser um número inteiro positivo'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limite deve ser entre 1 e 100'),
  handleValidationErrors
];