import pool from '../config/database.js';

export const createOrder = async ({ usuario_id, items, total, metodo_pagamento, status_pagamento = 'pendente' }) => {
  const itemsJSON = JSON.stringify(items);
  const [result] = await pool.execute(
    `INSERT INTO pedidos (usuario_id, items, total, metodo_pagamento, status_pagamento, criado_em) VALUES (?, ?, ?, ?, ?, NOW())`,
    [usuario_id, itemsJSON, total, metodo_pagamento, status_pagamento]
  );
  return { id: result.insertId, usuario_id, items, total, metodo_pagamento, status_pagamento };
};

export const findOrderById = async (id) => {
  const [rows] = await pool.execute(
    `SELECT * FROM pedidos WHERE id = ?`,
    [id]
  );
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    items: JSON.parse(rows[0].items)
  };
};

export const findOrdersByUserId = async (usuario_id, { page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT * FROM pedidos WHERE usuario_id = ? ORDER BY criado_em DESC LIMIT ? OFFSET ?`,
    [usuario_id, limit, offset]
  );
  const [countRows] = await pool.execute(
    'SELECT COUNT(*) AS total FROM pedidos WHERE usuario_id = ?',
    [usuario_id]
  );
  
  const orders = rows.map(order => ({
    ...order,
    items: JSON.parse(order.items)
  }));

  return { orders, total: countRows[0].total };
};

export const findAllOrders = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const [rows] = await pool.execute(
    `SELECT p.*, u.nome as usuario_nome, u.email as usuario_email FROM pedidos p
     LEFT JOIN usuarios u ON p.usuario_id = u.id
     ORDER BY p.criado_em DESC LIMIT ? OFFSET ?`,
    [limit, offset]
  );
  const [countRows] = await pool.execute('SELECT COUNT(*) AS total FROM pedidos');
  
  const orders = rows.map(order => ({
    ...order,
    items: JSON.parse(order.items)
  }));

  return { orders, total: countRows[0].total };
};

export const updateOrderStatus = async (id, { status_pagamento, metodo_pagamento }) => {
  const updates = [];
  const values = [];

  if (status_pagamento !== undefined) {
    updates.push('status_pagamento = ?');
    values.push(status_pagamento);
  }

  if (metodo_pagamento !== undefined) {
    updates.push('metodo_pagamento = ?');
    values.push(metodo_pagamento);
  }

  if (updates.length === 0) return false;

  const [result] = await pool.execute(
    `UPDATE pedidos SET ${updates.join(', ')} WHERE id = ?`,
    [...values, id]
  );

  return result.affectedRows > 0;
};

export const deleteOrder = async (id) => {
  const [result] = await pool.execute(
    `DELETE FROM pedidos WHERE id = ?`,
    [id]
  );
  return result.affectedRows > 0;
};
