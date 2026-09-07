import { verifyToken } from '../utils/jwt.js';
import { sendError } from '../utils/response.js';
import { isPageAllowed } from '../models/Permission.js';

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendError(res, 'Token de acesso não fornecido', 401);
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (!decoded || decoded.type !== 'access') {
    return sendError(res, 'Token inválido ou expirado', 401);
  }

  req.user = {
    id: decoded.id,
    email: decoded.email,
    nivel_acesso: decoded.nivel_acesso
  };

  next();
};

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Usuário não autenticado', 401);
    }

    if (!allowedRoles.includes(req.user.nivel_acesso)) {
      return sendError(res, 'Acesso negado: permissão insuficiente', 403);
    }

    next();
  };
};

export const authorizePage = (page) => async (req, res, next) => {
  if (!req.user) {
    return sendError(res, 'Usuário não autenticado', 401);
  }

  const allowed = await isPageAllowed(req.user.id, req.user.nivel_acesso, req.user.email, page);
  if (!allowed) {
    return sendError(res, 'Acesso negado para esta página', 403);
  }

  next();
};

export const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);

  if (decoded && decoded.type === 'access') {
    req.user = {
      id: decoded.id,
      email: decoded.email,
      nivel_acesso: decoded.nivel_acesso
    };
  }

  next();
};