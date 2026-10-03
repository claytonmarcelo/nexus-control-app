import { body, param, query, validationResult } from 'express-validator';
import { sendError } from '../utils/response.js';
import { validatePassword } from '../utils/passwordPolicy.js';
import { PAGE_PERMISSION_KEYS } from '../config/permissions.js';
const sanitizeText = (val) => (typeof val === 'string' ? val.replace(/[<>]/g, '') : val);
const passwordField = (field, label) => body(field)
    .isString().withMessage(`${label} deve ser texto`)
    .notEmpty().withMessage(`${label} é obrigatória`)
    .isLength({ max: 128 }).withMessage(`${label} excede o limite máximo permitido`)
    .custom((value) => {
    const result = validatePassword(value);
    if (result !== true)
        throw new Error(result);
    return true;
});
export const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return sendError(res, 'Dados inválidos', 400, errors.array());
    }
    next();
};
export const validateRegister = [
    body('nome')
        .isString().withMessage('Nome deve ser texto')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
        .customSanitizer(sanitizeText),
    body('email')
        .isString().withMessage('Email deve ser texto')
        .trim()
        .notEmpty().withMessage('Email é obrigatório')
        .isLength({ max: 254 }).withMessage('Email inválido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    passwordField('senha', 'Senha'),
    handleValidationErrors
];
export const validateLogin = [
    body('email')
        .isString().withMessage('Email deve ser texto')
        .trim()
        .notEmpty().withMessage('Email é obrigatório')
        .isLength({ max: 254 }).withMessage('Email inválido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('senha')
        .isString().withMessage('Senha deve ser texto')
        .notEmpty().withMessage('Senha é obrigatória')
        .isLength({ max: 128 }).withMessage('Senha inválida'),
    handleValidationErrors
];
export const validateForgotPassword = [
    body('email')
        .isString().withMessage('Email deve ser texto')
        .trim()
        .notEmpty().withMessage('Email é obrigatório')
        .isLength({ max: 254 }).withMessage('Email inválido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    handleValidationErrors
];
export const validateResetPassword = [
    body('token')
        .isString().withMessage('Token de recuperação deve ser texto')
        .trim()
        .notEmpty().withMessage('Token de recuperação é obrigatório')
        .isLength({ min: 1, max: 128 }).withMessage('Token inválido'),
    passwordField('senha', 'Nova senha'),
    handleValidationErrors
];
export const validateRefreshToken = [
    body('refreshToken')
        .isString().withMessage('Refresh token deve ser texto')
        .trim()
        .notEmpty().withMessage('Refresh token é obrigatório')
        .isLength({ max: 2048 }).withMessage('Refresh token inválido'),
    handleValidationErrors
];
export const validateItem = [
    body('nome')
        .isString().withMessage('Nome deve ser texto')
        .trim()
        .notEmpty().withMessage('Nome do item é obrigatório')
        .isLength({ min: 1, max: 200 }).withMessage('Nome deve ter entre 1 e 200 caracteres')
        .customSanitizer(sanitizeText),
    body('descricao')
        .optional()
        .isString().withMessage('Descrição deve ser texto')
        .trim()
        .isLength({ max: 1000 }).withMessage('Descrição deve ter no máximo 1000 caracteres')
        .customSanitizer(sanitizeText),
    body('categoria')
        .optional()
        .isString().withMessage('Categoria deve ser texto')
        .trim()
        .isLength({ max: 80 }).withMessage('Categoria inválida')
        .customSanitizer(sanitizeText),
    body('valor_venda').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Valor de venda inválido'),
    body('valor_aluguel_mensal').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Valor de aluguel inválido'),
    body('estoque').optional().isInt({ min: 0, max: 100000 }).withMessage('Estoque inválido'),
    handleValidationErrors
];
export const validateUserUpdate = [
    body('nome')
        .optional()
        .isString().withMessage('Nome deve ser texto')
        .trim()
        .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
        .customSanitizer(sanitizeText),
    body('email')
        .optional()
        .isString().withMessage('Email deve ser texto')
        .trim()
        .isLength({ max: 254 }).withMessage('Email inválido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    body('nivel_acesso')
        .optional()
        .isIn(['admin', 'funcionario', 'cliente']).withMessage('Nível de acesso inválido'),
    handleValidationErrors
];
export const validateAdminUserCreate = [
    body('nome')
        .isString().withMessage('Nome deve ser texto')
        .trim()
        .notEmpty().withMessage('Nome é obrigatório')
        .isLength({ min: 2, max: 100 }).withMessage('Nome deve ter entre 2 e 100 caracteres')
        .customSanitizer(sanitizeText),
    body('email')
        .isString().withMessage('Email deve ser texto')
        .trim()
        .notEmpty().withMessage('Email é obrigatório')
        .isLength({ max: 254 }).withMessage('Email inválido')
        .isEmail().withMessage('Email inválido')
        .normalizeEmail(),
    passwordField('senha', 'Senha'),
    body('nivel_acesso')
        .isIn(['admin', 'funcionario', 'cliente']).withMessage('Nível de acesso inválido'),
    handleValidationErrors
];
export const validatePermissions = [
    body('permissions')
        .isObject().withMessage('Permissões inválidas')
        .custom((permissions) => {
        for (const page of PAGE_PERMISSION_KEYS) {
            if (typeof permissions[page] !== 'boolean') {
                throw new Error(`Permissão inválida para a página ${page}`);
            }
        }
        return true;
    }),
    handleValidationErrors
];
export const validateIdParam = [
    param('id')
        .isInt({ min: 1 }).withMessage('ID deve ser um número inteiro positivo'),
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
export const validatePasswordChange = [
    body('senha_atual')
        .isString().withMessage('Senha atual deve ser texto')
        .notEmpty().withMessage('Senha atual é obrigatória')
        .isLength({ max: 128 }).withMessage('Senha atual inválida'),
    passwordField('nova_senha', 'Nova senha'),
    handleValidationErrors
];
export const validateAccountDeletion = [
    body('senha_atual')
        .isString().withMessage('Senha atual deve ser texto')
        .notEmpty().withMessage('Senha atual é obrigatória')
        .isLength({ max: 128 }).withMessage('Senha atual inválida'),
    handleValidationErrors
];
