import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, verifyPassword, findUserById } from '../../infrastructure/User.js';
import { USER_ROLES } from '../../infrastructure/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, decodeToken } from '../../utils/jwt.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { createPasswordResetToken, resetPasswordWithToken } from '../../infrastructure/PasswordReset.js';
import { sendPasswordResetEmail } from '../../utils/email.js';
import { getUserPermissions } from '../../infrastructure/Permission.js';
import { isAccountLocked, recordFailedLogin, resetFailedLogins } from '../../infrastructure/security/bruteForceProtection.js';
import { revokeToken } from '../../infrastructure/security/tokenBlacklist.js';

// Dummy hash fixo para tempo de resposta constante, impedindo timing attack e enumeração de emails
const DUMMY_HASH = '$2a$12$e8wV4W3Yg3i8c8G5c.oVne3MvR4e4u5R7f.Dq0/J9/l4Hj.w.0f3e';

const publicUser = async (user) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  nivel_acesso: user.nivel_acesso,
  permissions: await getUserPermissions(user.id, user.nivel_acesso, user.email),
});

export const register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return sendError(res, 'Email já cadastrado', 409);
    }

    const user = await createUser({ nome, email, senha, nivel_acesso: USER_ROLES.CLIENTE });
    const accessToken = generateToken({ id: user.id, email: user.email, nivel_acesso: user.nivel_acesso });
    const refreshToken = generateRefreshToken({ id: user.id });

    sendSuccess(res, {
      user: await publicUser(user),
      accessToken,
      refreshToken,
    }, 'Usuário cadastrado com sucesso', 201);
  } catch (error) {
    console.error('Erro no registro:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';

    // Proteção contra ataques de força bruta direcionados ao email
    if (isAccountLocked(normalizedEmail)) {
      return sendError(res, 'Muitas tentativas de login incorretas. Tente novamente em 15 minutos.', 429);
    }

    const user = await findUserByEmail(email);

    if (!user) {
      // Executa hash dummy para tempo de resposta constante (mitigação de timing attack)
      await bcrypt.compare(senha, DUMMY_HASH);
      recordFailedLogin(normalizedEmail);
      return sendError(res, 'Credenciais inválidas', 401);
    }

    const isMatch = await verifyPassword(senha, user.senha);
    if (!isMatch || (user.ativo !== undefined && !user.ativo)) {
      recordFailedLogin(normalizedEmail);
      return sendError(res, 'Credenciais inválidas', 401);
    }

    // Sucesso: reseta contagem de falhas
    resetFailedLogins(normalizedEmail);

    const accessToken = generateToken({ id: user.id, email: user.email, nivel_acesso: user.nivel_acesso });
    const refreshToken = generateRefreshToken({ id: user.id });

    sendSuccess(res, {
      user: await publicUser(user),
      accessToken,
      refreshToken,
    }, 'Login realizado com sucesso');
  } catch (error) {
    console.error('Erro no login:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const resetToken = await createPasswordResetToken(email);
    if (resetToken) {
      try {
        await sendPasswordResetEmail({ email, token: resetToken });
      } catch (emailErr) {
        console.warn('Falha no envio de email de recuperação:', emailErr.message);
      }
    }

    // Prevenção contra vazamento de dados: em produção, o token não é exposto na resposta
    const data = (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development') && resetToken
      ? { resetToken }
      : null;

    sendSuccess(res, data, 'Se o email estiver cadastrado, as instruções de recuperação foram preparadas');
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, senha } = req.body;
    const reset = await resetPasswordWithToken(token, senha);

    if (!reset) {
      return sendError(res, 'Token de recuperação inválido ou expirado', 400);
    }

    sendSuccess(res, null, 'Senha redefinida com sucesso');
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = verifyRefreshToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return sendError(res, 'Refresh token inválido', 401);
    }

    const user = await findUserById(decoded.id);
    if (!user || (user.ativo !== undefined && !user.ativo)) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    sendSuccess(res, {
      accessToken: generateToken({ id: user.id, email: user.email, nivel_acesso: user.nivel_acesso }),
      refreshToken: generateRefreshToken({ id: user.id }),
    }, 'Token renovado');
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const me = async (req, res) => {
  try {
    const user = await findUserById(req.user.id);
    if (!user || (user.ativo !== undefined && !user.ativo)) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    sendSuccess(res, { user: await publicUser(user) }, 'Dados do usuário');
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const logout = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const decoded = decodeToken(token);
      if (decoded?.jti) {
        revokeToken(decoded.jti, decoded.exp);
      }
    }
    sendSuccess(res, null, 'Logout realizado com sucesso');
  } catch (error) {
    sendSuccess(res, null, 'Logout realizado com sucesso');
  }
};