import { UserRepository } from '../../domain/repositories/UserRepository.js';
import { generateTokens, verifyToken } from '../../infrastructure/utils/jwt.js';
import { sendError, sendSuccess } from '../../infrastructure/utils/response.js';
import { createPasswordResetToken, resetPasswordWithToken } from '../../infrastructure/PasswordReset.js';
import { sendPasswordResetEmail } from '../../utils/email.js';

export class AuthUseCase {
  constructor(userRepository) {
    this.userRepository = userRepository;
  }

  async register({ nome, email, senha, nivel_acesso }) {
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new Error('Email já cadastrado');
    }

    const user = await this.userRepository.create({ nome, email, senha, nivel_acesso });
    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      nivel_acesso: user.nivel_acesso
    });

    return sendSuccess(null, {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }, 'Usuário cadastrado com sucesso', 201);
  }

  async login({ email, senha }) {
    const user = await this.userRepository.findByEmail(email, true);
    if (!user) {
      throw new Error('Credenciais inválidas');
    }

    const isValidPassword = await user.verifyPassword(senha);
    if (!isValidPassword) {
      throw new Error('Credenciais inválidas');
    }

    if (!user.ativo) {
      throw new Error('Conta desativada');
    }

    const { accessToken, refreshToken } = generateTokens({
      id: user.id,
      email: user.email,
      nivel_acesso: user.nivel_acesso
    });

    return sendSuccess(null, {
      user: user.toJSON(),
      accessToken,
      refreshToken
    }, 'Login realizado com sucesso');
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = verifyToken(refreshToken);
      if (decoded.type !== 'refresh') {
        throw new Error('Token inválido');
      }

      const user = await this.userRepository.findAuthState(decoded.id);
      if (!user || !user.ativo) {
        throw new Error('Usuário não encontrado ou conta desativada');
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens({
        id: user.id,
        email: user.email,
        nivel_acesso: user.nivel_acesso
      });

      return sendSuccess(null, {
        user: user.toJSON(),
        accessToken,
        refreshToken: newRefreshToken
      }, 'Token atualizado com sucesso');
    } catch (error) {
      throw new Error('Token inválido ou expirado');
    }
  }

  async forgotPassword(email) {
    const resetToken = await createPasswordResetToken(email);
    if (resetToken) {
      try {
        await sendPasswordResetEmail({ email, token: resetToken });
      } catch (err) {
        console.warn('Falha no envio de email:', err.message);
      }
    }

    const data = resetToken ? { resetToken } : null;
    return sendSuccess(null, data, 'Se o email existir, você receberá instruções de recuperação');
  }

  async resetPassword(token, newPassword) {
    const reset = await resetPasswordWithToken(token, newPassword);
    if (!reset) {
      throw new Error('Token de recuperação inválido ou expirado');
    }
    return sendSuccess(null, {}, 'Senha atualizada com sucesso');
  }
}