import { createUser, findUserByEmail, findAllUsers, findUserById, updateUser, deleteUser, updatePassword } from '../../infrastructure/User.js';
import { USER_ROLES, verifyPassword } from '../../infrastructure/User.js';
import { desativarConta, obterObrigacoesConta, STATUS_CONTA } from '../../infrastructure/Conta.js';
import { sendSuccess, sendError } from '../../utils/response.js';
import { isRootAdmin, ROOT_ADMIN_EMAIL } from '../../config/access.js';
import { getUserPermissions, setUserPermissions } from '../../infrastructure/Permission.js';
import { PAGE_PERMISSION_KEYS } from '../../config/permissions.js';
export const getPermissions = async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user)
            return sendError(res, 'Usuário não encontrado', 404);
        sendSuccess(res, {
            userId: user.id,
            permissions: await getUserPermissions(user.id, user.nivel_acesso, user.email),
        }, 'Permissões carregadas');
    }
    catch (error) {
        console.error('Erro ao carregar permissões:', error);
        sendError(res, 'Erro interno do servidor', 500);
    }
};
export const updatePermissions = async (req, res) => {
    try {
        const user = await findUserById(req.params.id);
        if (!user)
            return sendError(res, 'Usuário não encontrado', 404);
        if (isRootAdmin(user))
            return sendError(res, 'As permissões do administrador raiz não podem ser alteradas', 403);
        const permissions = Object.fromEntries(PAGE_PERMISSION_KEYS.map((page) => [page, req.body.permissions[page]]));
        sendSuccess(res, { userId: user.id, permissions: await setUserPermissions(user.id, permissions) }, 'Permissões atualizadas');
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Erro ao criar usuário:', error);
        sendError(res, 'Erro interno do servidor', 500);
    }
};
export const getAll = async (req, res) => {
    try {
        // Filtros administrativos (§16): situação da conta e busca por nome/e-mail.
        const { status_conta, q } = req.query;
        if (status_conta && !Object.values(STATUS_CONTA).includes(String(status_conta))) {
            return sendError(res, 'Filtro de situação de conta inválido', 400);
        }
        const users = await findAllUsers({
            status_conta: status_conta ? String(status_conta) : null,
            q: q ? String(q).slice(0, 150) : null,
        });
        sendSuccess(res, { users }, 'Usuários listados com sucesso');
    }
    catch (error) {
        console.error('Erro ao listar usuários:', error);
        sendError(res, 'Erro interno do servidor', 500);
    }
};
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const requesterRole = req.user?.nivel_acesso;
        const requesterId = req.user?.id;
        if (requesterRole !== USER_ROLES.ADMIN && requesterId !== parseInt(id)) {
            return sendError(res, 'Sem permissão para visualizar este usuário', 403);
        }
        const user = await findUserById(id);
        if (!user) {
            return sendError(res, 'Usuário não encontrado', 404);
        }
        sendSuccess(res, { user }, 'Usuário encontrado');
    }
    catch (error) {
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
    }
    catch (error) {
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
        if (requesterId === parseInt(id)) {
            return sendError(res, 'Não é possível excluir sua própria conta', 400);
        }
        if (isRootAdmin(targetUser)) {
            return sendError(res, 'O administrador raiz não pode ser excluído', 403);
        }
        if (requesterRole !== USER_ROLES.ADMIN) {
            return sendError(res, 'Apenas administradores podem excluir usuários', 403);
        }
        const deleted = await deleteUser(id);
        if (!deleted) {
            return sendError(res, 'Usuário não encontrado', 404);
        }
        sendSuccess(res, null, 'Usuário excluído com sucesso');
    }
    catch (error) {
        // Histórico de aluguéis preserva a relação com a conta: o banco recusa a
        // exclusão física nesses casos. A orientação é desativar (soft delete).
        if (error?.code === 'ER_ROW_IS_REFERENCED_2') {
            return sendError(res, 'Este usuário possui registros que não podem ser apagados. Utilize a desativação da conta para preservar o histórico.', 409);
        }
        console.error('Erro ao excluir usuário:', error);
        sendError(res, 'Erro interno do servidor', 500);
    }
};
/**
 * Desativação da própria conta (exclusão solicitada pelo cliente).
 * Regra central: a conta é DESATIVADA, nunca apagada fisicamente — pedidos,
 * pagamentos, aluguéis e histórico permanecem para o Administrador (§23–§25).
 * Obrigações em aberto (pagamento pendente, aluguel ativo/vencido) exigem
 * confirmação explícita antes da desativação (§56).
 */
export const deleteOwnAccount = async (req, res) => {
    try {
        const user = await findUserById(req.user.id, true);
        if (!user)
            return sendError(res, 'Usuário não encontrado', 404);
        if (isRootAdmin(user)) {
            return sendError(res, 'A conta do administrador raiz não pode ser desativada', 403);
        }
        if (!await verifyPassword(req.body.senha_atual, user.senha)) {
            return sendError(res, 'Senha atual incorreta', 401);
        }
        const confirmarObrigacoes = req.body.confirmar_obrigacoes === true || req.body.confirmar_obrigacoes === 'true';
        const obrigacoes = await obterObrigacoesConta(req.user.id);
        if (obrigacoes.possui_obrigacoes && !confirmarObrigacoes) {
            return sendError(res, 'Sua conta possui pendências ativas. Elas permanecerão registradas e poderão ser acompanhadas pelo administrador mesmo após a desativação. Revise as pendências e confirme para continuar.', 409, { obrigacoes });
        }
        const result = await desativarConta(req.user.id);
        if (result.reason === 'root-admin') {
            return sendError(res, 'A conta do administrador raiz não pode ser desativada', 403);
        }
        if (result.reason === 'already-desativada') {
            return sendError(res, 'Esta conta já está desativada', 400);
        }
        if (!result.desativada) {
            return sendError(res, 'Usuário não encontrado', 404);
        }
        sendSuccess(res, { desativada: true }, 'Conta desativada com sucesso. Seus registros foram preservados no histórico do sistema.');
    }
    catch (error) {
        console.error('Erro ao desativar a própria conta:', error);
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
            const { verifyPassword } = await import('../../infrastructure/User.js');
            const isValid = await verifyPassword(senha_atual, user.senha);
            if (!isValid) {
                return sendError(res, 'Senha atual incorreta', 401);
            }
        }
        await updatePassword(id, nova_senha);
        sendSuccess(res, null, 'Senha alterada com sucesso');
    }
    catch (error) {
        console.error('Erro ao alterar senha:', error);
        sendError(res, 'Erro interno do servidor', 500);
    }
};
