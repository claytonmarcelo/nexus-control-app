import { User } from '../entities/User.js';
export class UserRepository {
    constructor(database) {
        this.database = database;
    }
    async create({ nome, email, senha, nivel_acesso }) {
        const hashedPassword = await User.hashPassword(senha);
        const [result] = await this.database.execute(`INSERT INTO usuarios (nome, email, senha, nivel_acesso, ativo, criado_em) VALUES (?, ?, ?, ?, 1, NOW())`, [nome, email, hashedPassword, nivel_acesso]);
        return new User({ id: result.insertId, nome, email, nivel_acesso, ativo: true });
    }
    async findByEmail(email) {
        const [rows] = await this.database.execute(`SELECT * FROM usuarios WHERE email = ?`, [email]);
        return rows[0] ? new User(rows[0]) : null;
    }
    async findById(id, includePassword = false) {
        const fields = includePassword
            ? 'id, nome, email, senha, nivel_acesso, ativo, criado_em'
            : 'id, nome, email, nivel_acesso, ativo, criado_em';
        const [rows] = await this.database.execute(`SELECT ${fields} FROM usuarios WHERE id = ?`, [id]);
        return rows[0] ? new User(rows[0]) : null;
    }
    async findAll() {
        const [rows] = await this.database.execute(`SELECT id, nome, email, nivel_acesso, ativo, criado_em FROM usuarios ORDER BY criado_em DESC`);
        return rows.map(row => new User(row));
    }
    async findAuthState(id) {
        const [rows] = await this.database.execute(`SELECT id, nome, email, nivel_acesso, ativo FROM usuarios WHERE id = ?`, [id]);
        return rows[0] ? new User(rows[0]) : null;
    }
    async update(id, { nome, email, nivel_acesso, ativo }) {
        const [result] = await this.database.execute(`UPDATE usuarios SET nome = ?, email = ?, nivel_acesso = ?, ativo = ? WHERE id = ? AND email <> ? AND LOWER(?) <> ?`, [nome, email, nivel_acesso, ativo === false ? 0 : 1, id, process.env.ROOT_ADMIN_EMAIL, email?.toLowerCase() || '', process.env.ROOT_ADMIN_EMAIL]);
        return result.affectedRows > 0;
    }
    async updateAccess(id, { nivel_acesso, ativo }) {
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
        const [result] = await this.database.execute(`UPDATE usuarios SET ${fields.join(', ')} WHERE id = ? AND email <> ?`, [...values, id, process.env.ROOT_ADMIN_EMAIL]);
        return result.affectedRows > 0;
    }
    async delete(id) {
        const [result] = await this.database.execute(`DELETE FROM usuarios WHERE id = ? AND email <> ?`, [id, process.env.ROOT_ADMIN_EMAIL]);
        return result.affectedRows > 0;
    }
    async updatePassword(id, newPassword) {
        const hashedPassword = await User.hashPassword(newPassword);
        const [result] = await this.database.execute(`UPDATE usuarios SET senha = ? WHERE id = ? AND email <> ?`, [hashedPassword, id, process.env.ROOT_ADMIN_EMAIL]);
        return result.affectedRows > 0;
    }
}
