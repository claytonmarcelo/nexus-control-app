import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, verifyPassword, findUserById, registrarLogin } from '../../infrastructure/User.js';
import { USER_ROLES } from '../../infrastructure/User.js';
import { generateToken, generateRefreshToken, verifyRefreshToken, decodeToken } from '../../utils/jwt.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { createPasswordResetToken, resetPasswordWithToken } from '../../infrastructure/PasswordReset.js';
import { sendPasswordResetEmail } from '../../utils/email.js';
import { getUserPermissions } from '../../infrastructure/Permission.js';
import { isAccountLocked, recordFailedLogin, resetFailedLogins } from '../../infrastructure/security/bruteForceProtection.js';
import { revokeToken } from '../../infrastructure/security/tokenBlacklist.js';
import {
  STATUS_CONTA,
  encontrarContaDesativadaPorEmailOriginal,
  criarVinculo,
} from '../../infrastructure/Conta.js';

// Dummy hash fixo para tempo de resposta constante, impedindo timing attack e enumeração de emails
const DUMMY_HASH = '$2a$12$e8wV4W3Yg3i8c8G5c.oVne3MvR4e4u5R7f.Dq0/J9/l4Hj.w.0f3e';

const publicUser = async (user) => ({
  id: user.id,
  nome: user.nome,
  email: user.email,
  nivel_acesso: user.nivel_acesso,
  status_conta: user.status_conta || STATUS_CONTA.ATIVO,
  criado_em: user.criado_em,
  permissions: await getUserPermissions(user.id, user.nivel_acesso, user.email),
});

export const register = async (req, res) => {
  try {
    const { nome, email, senha, senha_conta_desativada } = req.body;
    const normalizedEmail = typeof email === 'string' ? email.toLowerCase().trim() : '';
    const existingUser = await findUserByEmail(normalizedEmail);

    if (existingUser) {
      return sendError(res, 'Email já cadastrado', 409);
    }

    // Regra de identidade (§28/§30): um e-mail liberado por desativação pode
    // recuperar o histórico, mas somente mediante prova de posse da conta
    // anterior (senha verificada aqui, no backend, contra o hash bcrypt).
    const contaAnterior = await encontrarContaDesativadaPorEmailOriginal(normalizedEmail);
    let vinculacaoValidada = false;
    if (contaAnterior) {
      if (!senha_conta_desativada) {
        return sendError(
          res,
          'Encontramos uma conta desativada com este e-mail. Para recuperar seu histórico, confirme a senha da conta anterior. Para começar do zero, cadastre-se com outro e-mail.',
          409,
          { verificacao_conta_desativada: true }
        );
      }
      const senhaAnteriorValida = await verifyPassword(senha_conta_desativada, contaAnterior.senha);
      if (!senhaAnteriorValida) {
        return sendError(res, 'Senha da conta anterior incorreta. Verifique os dados e tente novamente.', 401);
      }
      vinculacaoValidada = true;
    }

    const user = await createUser({ nome, email, senha, nivel_acesso: USER_ROLES.CLIENTE });

    if (vinculacaoValidada && contaAnterior) {
      await criarVinculo(user.id, contaAnterior.id);
    }

    const accessToken = generateToken({ id: user.id, email: user.email, nivel_acesso: user.nivel_acesso });
    const refreshToken = generateRefreshToken({ id: user.id });

    sendSuccess(res, {
      user: await publicUser(user),
      accessToken,
      refreshToken,
      recuperou_historico: vinculacaoValidada,
    }, vinculacaoValidada
      ? 'Cadastro realizado com sucesso. Seu histórico anterior foi recuperado.'
      : 'Usuário cadastrado com sucesso', 201);
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

    let user = await findUserByEmail(email);

    if (!user) {
      // Contas desativadas tiveram o e-mail liberado para novo cadastro, mas o
      // endereço original continua reservado em email_original para fins de aviso.
      const contaDesativada = await encontrarContaDesativadaPorEmailOriginal(normalizedEmail);
      if (contaDesativada) {
        // Só revela o estado da conta após prova da senha (evita enumeração).
        const matchAntigo = await verifyPassword(senha, contaDesativada.senha);
        if (matchAntigo) {
          return sendError(res, 'Esta conta está desativada. Caso queira voltar a utilizar o Nexus, realize um novo cadastro.', 403);
        }
      }
      // Executa hash dummy para tempo de resposta constante (mitigação de timing attack)
      await bcrypt.compare(senha, DUMMY_HASH);
      recordFailedLogin(normalizedEmail);
      return sendError(res, 'Credenciais inválidas', 401);
    }

    const isMatch = await verifyPassword(senha, user.senha);
    if (!isMatch) {
      recordFailedLogin(normalizedEmail);
      return sendError(res, 'Credenciais inválidas', 401);
    }

    // Senha correta: agora é seguro informar o estado da conta, com mensagem
    // amigável e sem detalhes internos (§26/§73).
    if (!user.ativo || user.status_conta === STATUS_CONTA.DESATIVADA) {
      if (user.status_conta === STATUS_CONTA.DESATIVADA) {
        return sendError(res, 'Esta conta está desativada. Caso queira voltar a utilizar o Nexus, realize um novo cadastro.', 403);
      }
      const bloqueadaPorInatividade = user.status_conta === STATUS_CONTA.BLOQUEADO_INATIVIDADE;
      return sendError(res, bloqueadaPorInatividade
        ? 'Sua conta foi bloqueada por inatividade prolongada. Entre em contato com o administrador do sistema para reativá-la.'
        : 'Sua conta está temporariamente indisponível. Entre em contato com o administrador do sistema.', 403);
    }

    // Sucesso: reseta contagem de falhas e registra o acesso (inatividade comercial
    // NÃO usa login como sinal — ultimo_login é apenas referência administrativa).
    resetFailedLogins(normalizedEmail);
    await registrarLogin(user.id);

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
      } catch (emailErr: any) {
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

    if (!decoded || (decoded as any).type !== 'refresh') {
      return sendError(res, 'Refresh token inválido', 401);
    }

    const user = await findUserById((decoded as any).id);
    if (!user) {
      return sendError(res, 'Usuário não encontrado', 404);
    }
    // Token válido não prolonga acesso de conta desativada/bloqueada (§98):
    // o refresh é negado e o middleware authenticate já barra as demais rotas.
    if (!user.ativo || user.status_conta === STATUS_CONTA.DESATIVADA) {
      const mensagem = user.status_conta === STATUS_CONTA.DESATIVADA
        ? 'Esta conta está desativada. Caso queira voltar a utilizar o Nexus, realize um novo cadastro.'
        : 'Sua conta está temporariamente indisponível. Entre em contato com o administrador do sistema.';
      return sendError(res, mensagem, 403);
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
      const decoded = decodeToken(token) as any;
      if (decoded?.jti) {
        revokeToken(decoded.jti, decoded.exp);
      }
    }
    sendSuccess(res, null, 'Logout realizado com sucesso');
  } catch (error) {
    sendSuccess(res, null, 'Logout realizado com sucesso');
  }
};
