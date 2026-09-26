import bcrypt from 'bcryptjs';
export const USER_ROLES = {
    ADMIN: 'admin',
    FUNCIONARIO: 'funcionario',
    CLIENTE: 'cliente'
};
export class User {
    constructor({ id, nome, email, senha, nivel_acesso, ativo, criado_em }) {
        this.id = id;
        this.nome = nome;
        this.email = email;
        this.senha = senha;
        this.nivel_acesso = nivel_acesso || USER_ROLES.CLIENTE;
        this.ativo = ativo !== undefined ? ativo : true;
        this.criado_em = criado_em;
    }
    static async hashPassword(password) {
        return bcrypt.hash(password, 12);
    }
    async verifyPassword(plainPassword) {
        return bcrypt.compare(plainPassword, this.senha);
    }
    async updatePassword(newPassword) {
        this.senha = await User.hashPassword(newPassword);
    }
    toJSON() {
        const { senha, ...userWithoutPassword } = this;
        return userWithoutPassword;
    }
}
