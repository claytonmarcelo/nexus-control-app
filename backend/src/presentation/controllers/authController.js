import { AuthUseCase } from '../../application/use-cases/AuthUseCase.js';
import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { PermissionRepository } from '../../domain/repositories/PermissionRepository.js';
import pool from '../../infrastructure/config/database.js';
import { sendError } from '../../infrastructure/utils/response.js';

const userRepository = new UserRepository(pool);
const permissionRepository = new PermissionRepository(pool);
const authUseCase = new AuthUseCase(userRepository);

const publicUser = async (user) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  nivel_acesso: user.nivel_acesso,
  permissions: await permissionRepository.getUserPermissions(user.id, user.nivel_acesso, user.email),
});

export const register = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const result = await authUseCase.register({ nome, email, senha, nivel_acesso: 'cliente' });
    
    const user = await userRepository.findByEmail(email);
    result.data.user = await publicUser(user);
    
    res.status(201).json(result);
  } catch (error) {
    console.error('Erro no registro:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Email já cadastrado' ? 409 : 500);
  }
};

export const login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const result = await authUseCase.login({ email, senha });
    
    const user = await userRepository.findByEmail(email);
    result.data.user = await publicUser(user);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro no login:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Credenciais inválidas' ? 401 : 500);
  }
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authUseCase.forgotPassword(email);
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao solicitar recuperação de senha:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, senha } = req.body;
    const result = await authUseCase.resetPassword(token, senha);
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao redefinir senha:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Token inválido ou expirado' ? 400 : 500);
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const result = await authUseCase.refreshToken(refreshToken);
    
    const user = await userRepository.findById(result.data.user.id);
    result.data.user = await publicUser(user);
    
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao renovar token:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Token inválido ou expirado' ? 401 : 500);
  }
};

export const me = async (req, res) => {
  try {
    const user = await userRepository.findById(req.user.id);
    if (!user) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    const result = {
      success: true,
      message: 'Dados do usuário',
      data: { user: await publicUser(user) },
      timestamp: new Date().toISOString()
    };
    res.status(200).json(result);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const logout = async (req, res) => {
  const result = {
    success: true,
    message: 'Logout realizado com sucesso',
    data: null,
    timestamp: new Date().toISOString()
  };
  res.status(200).json(result);
};