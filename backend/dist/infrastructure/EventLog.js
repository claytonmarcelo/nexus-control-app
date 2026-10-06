import pool from '../config/database.js';
/**
 * Trilha cronológica de auditoria (tabela historico_eventos).
 * Registros históricos NUNCA são apagados por desativação de conta —
 * as FKs usam SET NULL justamente para preservar o evento mesmo se a
 * entidade de origem for removida por decisão administrativa futura.
 */
export const registrarEvento = async ({ usuarioId = null, pedidoId = null, aluguelId = null, evento, descricao = null, metadados = null, registradoPor = null }, connection = pool) => {
    await connection.execute(`INSERT INTO historico_eventos (usuario_id, pedido_id, aluguel_id, evento, descricao, metadados, registrado_por)
     VALUES (?, ?, ?, ?, ?, ?, ?)`, [usuarioId, pedidoId, aluguelId, evento, descricao, metadados ? JSON.stringify(metadados) : null, registradoPor]);
};
export const listarEventosPorUsuarios = async (usuarioIds, { limit = 200 } = {}) => {
    const ids = (usuarioIds || []).filter((id) => Number.isInteger(Number(id)));
    if (ids.length === 0)
        return [];
    const placeholders = ids.map(() => '?').join(',');
    const [rows] = await pool.query(`SELECT id, usuario_id, pedido_id, aluguel_id, evento, descricao, metadados, registrado_por, criado_em
     FROM historico_eventos
     WHERE usuario_id IN (${placeholders})
     ORDER BY criado_em DESC, id DESC
     LIMIT ?`, [...ids.map(Number), Number(limit)]);
    return rows.map((row) => ({
        ...row,
        metadados: row.metadados ? safeParse(row.metadados) : null,
    }));
};
const safeParse = (value) => {
    try {
        return JSON.parse(value);
    }
    catch {
        return null;
    }
};
