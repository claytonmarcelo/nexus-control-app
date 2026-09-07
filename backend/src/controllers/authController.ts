import { createUser, findUserByEmail, verifyPassword, findUserById } from '../models/User.js';
import { USER_ROLES } from '../models/User.js';
import { generateToken, generateRefreshToken, verifyToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createPasswordResetToken, resetPasswordWithToken } from '../models/PasswordReset.js';
import { sendPasswordResetEmail } from '../utils/email.js';
import { getUserPermissions } from '../models/Permission.js';

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
    const user = await findUserByEmail(email);

    if (!user || !(await verifyPassword(senha, user.senha))) {
      return sendError(res, 'Credenciais inválidas', 401);
    }

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
    const emailSent = resetToken ? await sendPasswordResetEmail({ email, token: resetToken }) : false;

    if (process.env.NODE_ENV === 'production' && resetToken && !emailSent) {
      return sendError(res, 'Serviço de email de recuperação indisponível', 503);
    }

    const data = !emailSent && process.env.NODE_ENV !== 'production' ? { resetToken } : null;

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
    const decoded = verifyToken(refreshToken);

    if (!decoded || decoded.type !== 'refresh') {
      return sendError(res, 'Refresh token inválido', 401);
    }

    const user = await findUserById(decoded.id);
    if (!user) {
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
    if (!user) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    sendSuccess(res, { user: await publicUser(user) }, 'Dados do usuário');
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const logout = async (req, res) => {
  sendSuccess(res, null, 'Logout realizado com sucesso');
};
