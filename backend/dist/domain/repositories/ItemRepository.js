import { Item } from '../entities/Item.js';
export class ItemRepository {
    constructor(database) {
        this.database = database;
    }
    async create({ nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque }) {
        const [result] = await this.database.execute(`INSERT INTO itens (nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_em) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`, [nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque]);
        return new Item({ id: result.insertId, nome, descricao, criado_por, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque });
    }
    async findAll({ page = 1, limit = 20 } = {}) {
        const offset = (page - 1) * limit;
        const [rows] = await this.database.execute(`SELECT i.*, u.nome as criador_nome FROM itens i
       LEFT JOIN usuarios u ON i.criado_por = u.id
       ORDER BY i.criado_em DESC LIMIT ? OFFSET ?`, [limit, offset]);
        const [countRows] = await this.database.execute('SELECT COUNT(*) AS total FROM itens');
        return {
            items: rows.map(row => new Item(row)),
            total: countRows[0].total
        };
    }
    async findById(id) {
        const [rows] = await this.database.execute(`SELECT i.*, u.nome as criador_nome FROM itens i
       LEFT JOIN usuarios u ON i.criado_por = u.id
       WHERE i.id = ?`, [id]);
        return rows[0] ? new Item(rows[0]) : null;
    }
    async findByUser(userId) {
        const [rows] = await this.database.execute(`SELECT * FROM itens WHERE criado_por = ? ORDER BY criado_em DESC`, [userId]);
        return rows.map(row => new Item(row));
    }
    async findByIds(ids) {
        if (!ids || ids.length === 0)
            return [];
        const placeholders = ids.map(() => '?').join(',');
        const [rows] = await this.database.execute(`SELECT id, nome, descricao, categoria, valor_venda, valor_aluguel_mensal, estoque FROM itens WHERE id IN (${placeholders})`, ids);
        return rows.map(row => new Item(row));
    }
    async update(id, { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque }) {
        const [result] = await this.database.execute(`UPDATE itens SET nome = ?, descricao = ?, categoria = ?, fabricante = ?, imagem_url = ?, valor_venda = ?, valor_aluguel_mensal = ?, estoque = ? WHERE id = ?`, [nome, descricao, categoria || 'Informática', fabricante || null, imagem_url || null, valor_venda || null, valor_aluguel_mensal || null, estoque ?? 1, id]);
        return result.affectedRows > 0;
    }
    async delete(id) {
        const [result] = await this.database.execute(`DELETE FROM itens WHERE id = ?`, [id]);
        return result.affectedRows > 0;
    }
    async canUserModify(itemId, userId, userRole) {
        if (userRole === 'admin')
            return true;
        const item = await this.findById(itemId);
        return item && item.criado_por === userId;
    }
}
