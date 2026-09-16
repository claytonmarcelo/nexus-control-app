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
  const [result] = await pool.execute(
    `INSERT INTO usuarios (nome, email, senha, nivel_acesso, ativo, criado_em) VALUES (?, ?, ?, ?, 1, NOW())`,
    [nome, email, hashedPassword, nivel_acesso]
  );
  return { id: result.insertId, nome, email, nivel_acesso, ativo: true };
};

export const findUserByEmail = async (email) => {
  const [rows] = await pool.execute(
    `SELECT * FROM usuarios WHERE email = ?`,
    [email]
  );
  return rows[0] || null;
};

export const findUserById = async (id, includePassword = false) => {
  const fields = includePassword
    ? 'id, nome, email, senha, nivel_acesso, ativo, criado_em'
    : 'id, nome, email, nivel_acesso, ativo, criado_em';
  const [rows] = await pool.execute(
    `SELECT ${fields} FROM usuarios WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const findAllUsers = async () => {
  const [rows] = await pool.execute(
    `SELECT id, nome, email, nivel_acesso, ativo, criado_em FROM usuarios ORDER BY criado_em DESC`
  );
  return rows;
};

/**
 * Lightweight user lookup used by the authentication middleware.  Resolving
 * this on each protected request makes account blocks and role changes take
 * effect before an existing JWT expires.
 */
export const findUserAuthState = async (id) => {
  const [rows] = await pool.execute(
    `SELECT id, nome, email, nivel_acesso, ativo FROM usuarios WHERE id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const updateUser = async (id, { nome, email, nivel_acesso, ativo }) => {
  const [result] = await pool.execute(
    `UPDATE usuarios SET nome = ?, email = ?, nivel_acesso = ?, ativo = ? WHERE id = ? AND email <> ? AND LOWER(?) <> ?`,
    [nome, email, nivel_acesso, ativo === false ? 0 : 1, id, ROOT_ADMIN_EMAIL, email?.toLowerCase() || '', ROOT_ADMIN_EMAIL]
  );
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

  if (fields.length === 0) return false;

  const [result] = await pool.execute(
    `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ? AND email <> ?`,
    [...values, id, ROOT_ADMIN_EMAIL]
  );
  return result.affectedRows > 0;
};

export const deleteUser = async (id) => {
  const [result] = await pool.execute(
    `DELETE FROM usuarios WHERE id = ? AND email <> ?`,
    [id, ROOT_ADMIN_EMAIL]
  );
  return result.affectedRows > 0;
};

export const verifyPassword = async (plainPassword, hashedPassword) => {
  return bcrypt.compare(plainPassword, hashedPassword);
};

export const updatePassword = async (id, newPassword) => {
  const hashedPassword = await bcrypt.hash(newPassword, 12);
  const [result] = await pool.execute(
    `UPDATE usuarios SET senha = ? WHERE id = ? AND email <> ?`,
    [hashedPassword, id, ROOT_ADMIN_EMAIL]
  );
  return result.affectedRows > 0;
};
