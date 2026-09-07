import pool from '../config/database.js';
import { USER_ROLES } from './User.js';

export const createItem = async ({ nome, descricao, criado_por, categoria = 'Informática', fabricante = null, imagem_url = null, valor_venda = null, valor_aluguel_mensal = null, estoque = 1 }) => {
  const [result] = await pool.execute(
    `INSERT INTO itens (nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
    [nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque]
  );
  return { id: result.insertId, nome, descricao, criado_por };
};

export const findAllItems = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT i.*, u.nome as criador_nome FROM itens i
     LEFT JOIN usuarios u ON i.criado_por = u.id
     ORDER BY i.criado_em DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM itens');
  return { items: rows, total: countRows[0].total };
};

export const findItemById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT i.*, u.nome as criador_nome FROM itens i
     LEFT JOIN usuarios u ON i.criado_por = u.id
     WHERE i.id = ?`,
    [id]
  );
  return rows[0] || null;
};

export const findItemsByUser = async (userId) => {
  const [rows] = await pool.execute(
    `SELECT * FROM itens WHERE criado_por = ? ORDER BY criado_em DESC`,
    [userId]
  );
  return rows;
};

export const updateItem = async (id, { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque }) => {
  const [result] = await pool.execute(
    `UPDATE itens SET nome = ?, descricao = ?, categoria = ?, fabricante = ?, imagem_url = ?, valor_venda = ?, valor_aluguel_mensal = ?, estoque = ? WHERE id = ?`,
    [nome, descricao, categoria || 'Informática', fabricante || null, imagem_url || null, valor_venda || null, valor_aluguel_mensal || null, estoque ?? 1, id]
  );
  return result.affectedRows > 0;
};

export const deleteItem = async (id) => {
  const [result] = await pool.execute(
    `DELETE FROM itens WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};

export const canUserModifyItem = async (itemId, userId, userRole) => {
  if (userRole === USER_ROLES.ADMIN) return true;
  
  const item = await findItemById(itemId);
  return item && item.criado_por === userId;
};