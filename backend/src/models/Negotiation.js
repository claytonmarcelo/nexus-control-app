import pool from '../config/database.js';

export const createNegotiation = async ({ usuario_id, item_id, tipo, quantidade }) => {
  const [items] = await pool.execute('SELECT * FROM itens WHERE id = ? LIMIT 1', [item_id]);
  const item = items[0];
  if (!item) return { error: 'Item não encontrado' };
  if (item.estoque < quantidade) return { error: 'Estoque insuficiente para esta simulação' };
  const valor_unitario = tipo === 'compra' ? item.valor_venda : item.valor_aluguel_mensal;
  if (!valor_unitario) return { error: `Este item não possui valor para ${tipo}` };
  const [result] = await pool.execute(
    'INSERT INTO negociacoes (usuario_id, item_id, tipo, quantidade, valor_unitario) VALUES (?, ?, ?, ?, ?)',
    [usuario_id, item_id, tipo, quantidade, valor_unitario]
  );
  return { id: result.insertId, item, tipo, quantidade, valor_unitario };
};

export const findNegotiationsByUser = async (usuario_id) => {
  const [rows] = await pool.execute(
    `SELECT n.*, i.nome, i.categoria FROM negociacoes n
     INNER JOIN itens i ON i.id = n.item_id
     WHERE n.usuario_id = ? ORDER BY n.criado_em DESC`,
    [usuario_id]
  );
  return rows;
};
