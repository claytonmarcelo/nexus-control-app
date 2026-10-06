import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import { ROOT_ADMIN_EMAIL } from '../config/access.js';
export const USER_ROLES = {
    ADMIN: 'admin',
    FUNCIONARIO: 'funcionario',
    CLIENTE: 'cliente'
};
export const createUser = async ({ nome, email, senha, nivel_acesso = USER_ROLES.CLIENTE }) => {
    const hashedPassword = await bcrypt.hash(senha, 12);
    const [result] = await pool.execute(`INSERT INTO usuarios (nome, email, senha, nivel_acesso, ativo, criado_em) VALUES (?, ?, ?, ?, 1, NOW())`, [nome, email, hashedPassword, nivel_acesso]);
    return { id: result.insertId, nome, email, nivel_acesso, ativo: true };
};
export const findUserByEmail = async (email) => {
    const [rows] = await pool.execute(`SELECT * FROM usuarios WHERE email = ?`, [email]);
    return rows[0] || null;
};
export const findUserById = async (id, includePassword = false) => {
    const fields = includePassword
        ? 'id, nome, email, senha, nivel_acesso, ativo, status_conta, desativado_em, email_original, criado_em'
        : 'id, nome, email, nivel_acesso, ativo, status_conta, desativado_em, email_original, criado_em';
    const [rows] = await pool.execute(`SELECT ${fields} FROM usuarios WHERE id = ?`, [id]);
    return rows[0] || null;
};
export const findAllUsers = async ({ status_conta = null, q = null } = {}) => {
    const conditions = [];
    const values = [];
    if (status_conta) {
        conditions.push('status_conta = ?');
        values.push(status_conta);
    }
    if (q) {
        // Escapa curingas do LIKE para busca literal segura por nome/e-mail.
        const like = `%${String(q).replace(/[%_\\]/g, '\\$&')}%`;
        conditions.push('(nome LIKE ? OR email LIKE ? OR email_original LIKE ?)');
        values.push(like, like, like);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const [rows] = await pool.query(`SELECT id, nome, email, nivel_acesso, ativo, status_conta, desativado_em, email_original, ultimo_login, criado_em FROM usuarios ${where} ORDER BY criado_em DESC`, values);
    return rows;
};
/** Registra o último acesso; base de dados da regra de inatividade e do painel administrativo. */
export const registrarLogin = async (id) => {
    await pool.execute('UPDATE usuarios SET ultimo_login = NOW() WHERE id = ?', [id]);
};
/**
 * Lightweight user lookup used by the authentication middleware.  Resolving
 * this on each protected request makes account blocks and role changes take
 * effect before an existing JWT expires.
 */
export const findUserAuthState = async (id) => {
    const [rows] = await pool.execute(`SELECT id, nome, email, nivel_acesso, ativo FROM usuarios WHERE id = ?`, [id]);
    return rows[0] || null;
};
export const updateUser = async (id, { nome, email, nivel_acesso, ativo }) => {
    const [result] = await pool.execute(`UPDATE usuarios SET nome = ?, email = ?, nivel_acesso = ?, ativo = ? WHERE id = ? AND email <> ? AND LOWER(?) <> ?`, [nome, email, nivel_acesso, ativo === false ? 0 : 1, id, ROOT_ADMIN_EMAIL, email?.toLowerCase() || '', ROOT_ADMIN_EMAIL]);
    return result.affectedRows > 0;
};
export const updateUserAccess = async (id, { nivel_acesso, ativo }) => {
    const fields = [];
    const values = [];
    if (nivel_acesso !== undefined) {
        fields.push('nivel_acesso = ?');
        values.push(nivel_acesso);
    }
    if (ativo !== undefined) {
        fields.push('ativo = ?');
        values.push(ativo ? 1 : 0);
    }
    if (fields.length === 0)
        return false;
    const [result] = await pool.execute(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ? AND email <> ?`, [...values, id, ROOT_ADMIN_EMAIL]);
    return result.affectedRows > 0;
};
export const deleteUser = async (id) => {
    const [result] = await pool.execute(`DELETE FROM usuarios WHERE id = ? AND email <> ?`, [id, ROOT_ADMIN_EMAIL]);
    return result.affectedRows > 0;
};
/**
 * Detecta histórico que NÃO pode ser apagado (guardrail: pedidos, pagamentos e
 * aluguéis são preservados). Como as FKs de pedidos cascadeiam a exclusão
 * física, a verificação precisa vir ANTES do DELETE — nunca depender do erro.
 */
export const usuarioComHistorico = async (id) => {
    const [rows] = await pool.execute(`SELECT
       (SELECT COUNT(*) FROM pedidos WHERE usuario_id = ?) AS pedidos,
       (SELECT COUNT(*) FROM alugueis WHERE usuario_id = ?) AS alugueis`, [id, id]);
    const { pedidos = 0, alugueis = 0 } = rows[0] || {};
    return Number(pedidos) > 0 || Number(alugueis) > 0;
};
export const deleteOwnUserAccount = async (id) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [users] = await connection.execute('SELECT id, email FROM usuarios WHERE id = ? FOR UPDATE', [id]);
        const user = users[0];
        if (!user) {
            await connection.rollback();
            transactionStarted = false;
            return { deleted: false, reason: 'not-found' };
        }
        if (user.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
            await connection.rollback();
            transactionStarted = false;
            return { deleted: false, reason: 'root-admin' };
        }
        const [rootAdmins] = await connection.execute('SELECT id FROM usuarios WHERE LOWER(email) = ? AND id <> ? LIMIT 1 FOR UPDATE', [ROOT_ADMIN_EMAIL, id]);
        const [itemCounts] = await connection.execute('SELECT COUNT(*) AS total FROM itens WHERE criado_por = ?', [id]);
        const rootAdminId = rootAdmins[0]?.id;
        if (Number(itemCounts[0].total) > 0 && !rootAdminId) {
            await connection.rollback();
            transactionStarted = false;
            return { deleted: false, reason: 'root-admin-missing' };
        }
        if (rootAdminId) {
            await connection.execute('UPDATE itens SET criado_por = ? WHERE criado_por = ?', [rootAdminId, id]);
        }
        const [result] = await connection.execute('DELETE FROM usuarios WHERE id = ? AND LOWER(email) <> ?', [id, ROOT_ADMIN_EMAIL]);
        if (result.affectedRows === 0) {
            await connection.rollback();
            transactionStarted = false;
            return { deleted: false, reason: 'not-found' };
        }
        await connection.commit();
        transactionStarted = false;
        return { deleted: true };
    }
    catch (error) {
        if (transactionStarted)
            await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
};
export const verifyPassword = async (plainPassword, hashedPassword) => {
    return bcrypt.compare(plainPassword, hashedPassword);
};
export const updatePassword = async (id, newPassword) => {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    const [result] = await pool.execute(`UPDATE usuarios SET senha = ? WHERE id = ? AND email <> ?`, [hashedPassword, id, ROOT_ADMIN_EMAIL]);
    return result.affectedRows > 0;
};
