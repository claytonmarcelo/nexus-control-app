import { 
  createUser,
  findUserByEmail,
  findAllUsers, 
  findUserById, 
  updateUser, 
  deleteUser,
  updatePassword 
} from '../models/User.js';
import { USER_ROLES } from '../models/User.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { isRootAdmin, ROOT_ADMIN_EMAIL } from '../config/access.js';
import { getUserPermissions, setUserPermissions } from '../models/Permission.js';
import { PAGE_PERMISSION_KEYS } from '../config/permissions.js';

export const getPermissions = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return sendError(res, 'Usuário não encontrado', 404);

    sendSuccess(res, {
      userId: user.id,
      permissions: await getUserPermissions(user.id, user.nivel_acesso, user.email),
    }, 'Permissões carregadas');
  } catch (error) {
    console.error('Erro ao carregar permissões:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const updatePermissions = async (req, res) => {
  try {
    const user = await findUserById(req.params.id);
    if (!user) return sendError(res, 'Usuário não encontrado', 404);
    if (isRootAdmin(user)) return sendError(res, 'As permissões do administrador raiz não podem ser alteradas', 403);

    const permissions = Object.fromEntries(PAGE_PERMISSION_KEYS.map((page) => [page, req.body.permissions[page]]));
    sendSuccess(res, { userId: user.id, permissions: await setUserPermissions(user.id, permissions) }, 'Permissões atualizadas');
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const create = async (req, res) => {
  try {
    const { nome, email, senha, nivel_acesso } = req.body;
    if (email.toLowerCase() === ROOT_ADMIN_EMAIL) {
      return sendError(res, 'O administrador raiz é reservado ao sistema', 403);
    }
    const existingUser = await findUserByEmail(email);

    if (existingUser) {
      return sendError(res, 'Email já cadastrado', 409);
    }

    const user = await createUser({ nome, email, senha, nivel_acesso });
    sendSuccess(res, { user }, 'Usuário criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getAll = async (req, res) => {
  try {
    const users = await findAllUsers();
    sendSuccess(res, { users }, 'Usuários listados com sucesso');
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await findUserById(id);

    if (!user) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    sendSuccess(res, { user }, 'Usuário encontrado');
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, email, nivel_acesso } = req.body;
    const requesterRole = req.user.nivel_acesso;
    const requesterId = req.user.id;
    const targetUser = await findUserById(id);

    if (!targetUser) {
      return sendError(res, 'Usuário não encontrado', 404);
    }
    if (isRootAdmin(targetUser)) {
      return sendError(res, 'O administrador raiz não pode ser alterado', 403);
    }

    if (requesterRole !== USER_ROLES.ADMIN && requesterId !== parseInt(id)) {
      return sendError(res, 'Sem permissão para atualizar este usuário', 403);
    }

    if (requesterRole !== USER_ROLES.ADMIN && nivel_acesso) {
      return sendError(res, 'Apenas administradores podem alterar nível de acesso', 403);
    }
    if (email?.toLowerCase() === ROOT_ADMIN_EMAIL) {
      return sendError(res, 'O email do administrador raiz é reservado', 403);
    }

    const updated = await updateUser(id, {
      nome: nome ?? targetUser.nome,
      email: email ?? targetUser.email,
      nivel_acesso: nivel_acesso ?? targetUser.nivel_acesso,
      ativo: targetUser.ativo
    });
    if (!updated) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    const user = await findUserById(id);
    sendSuccess(res, { user }, 'Usuário atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const requesterRole = req.user.nivel_acesso;
    const requesterId = req.user.id;
    const targetUser = await findUserById(id);

    if (!targetUser) {
      return sendError(res, 'Usuário não encontrado', 404);
    }
    if (isRootAdmin(targetUser)) {
      return sendError(res, 'O administrador raiz não pode ser excluído', 403);
    }

    if (requesterRole !== USER_ROLES.ADMIN) {
      return sendError(res, 'Apenas administradores podem excluir usuários', 403);
    }

    if (requesterId === parseInt(id)) {
      return sendError(res, 'Não é possível excluir sua própria conta', 400);
    }

    const deleted = await deleteUser(id);
    if (!deleted) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    sendSuccess(res, null, 'Usuário excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { senha_atual, nova_senha } = req.body;
    const requesterRole = req.user.nivel_acesso;
    const requesterId = req.user.id;
    const targetUser = await findUserById(id);

    if (!targetUser) {
      return sendError(res, 'Usuário não encontrado', 404);
    }
    if (isRootAdmin(targetUser)) {
      return sendError(res, 'A senha do administrador raiz não pode ser alterada', 403);
    }

    if (requesterRole !== USER_ROLES.ADMIN && requesterId !== parseInt(id)) {
      return sendError(res, 'Sem permissão para alterar senha deste usuário', 403);
    }

    if (requesterRole !== USER_ROLES.ADMIN) {
      const user = await findUserById(id, true);
      const { verifyPassword } = await import('../models/User.js');
      const isValid = await verifyPassword(senha_atual, user.senha);
      if (!isValid) {
        return sendError(res, 'Senha atual incorreta', 401);
      }
    }

    await updatePassword(id, nova_senha);
    sendSuccess(res, null, 'Senha alterada com sucesso');
  } catch (error) {
    console.error('Erro ao alterar senha:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};