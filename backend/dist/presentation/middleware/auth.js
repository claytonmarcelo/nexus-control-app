import { verifyToken } from '../../infrastructure/utils/jwt.js';
import { sendError } from '../../infrastructure/utils/response.js';
import { isPageAllowed } from '../../domain/repositories/PermissionRepository.js';
import { UserRepository } from '../../domain/repositories/UserRepository.js';
import pool from '../../infrastructure/config/database.js';
const userRepository = new UserRepository(pool);
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return sendError(res, 'Token de acesso não fornecido', 401);
        }
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token);
        if (!decoded || decoded.type !== 'access') {
            return sendError(res, 'Token inválido ou expirado', 401);
        }
        // Revalidar status do usuário no banco a cada requisição
        const userAuthState = await userRepository.findAuthState(decoded.id);
        if (!userAuthState) {
            return sendError(res, 'Usuário não encontrado', 401);
        }
        if (!userAuthState.ativo) {
            return sendError(res, 'Conta desativada ou não encontrada', 401);
        }
        // Usar nivel_acesso do banco, não do token (para refletir mudanças imediatas)
        req.user = {
            id: userAuthState.id,
            email: userAuthState.email,
            nivel_acesso: userAuthState.nivel_acesso
        };
        next();
    }
    catch (error) {
        console.error('Erro na autenticação:', error.message);
        return sendError(res, 'Erro de autenticação ou banco indisponível', 401);
    }
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
    try {
        if (!req.user) {
            return sendError(res, 'Usuário não autenticado', 401);
        }
        const allowed = await isPageAllowed(req.user.id, req.user.nivel_acesso, req.user.email, page);
        if (!allowed) {
            return sendError(res, 'Acesso negado para esta página', 403);
        }
        next();
    }
    catch (error) {
        console.error('Erro ao verificar permissão da página:', error.message);
        // Em caso de falha de banco de dados, permite navegação padrão para evitar 504/bloqueio
        next();
    }
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
