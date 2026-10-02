import pool from '../config/database.js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { ROOT_ADMIN_EMAIL } from '../config/access.js';
import { validatePassword } from '../infrastructure/utils/passwordPolicy.js';
dotenv.config();
const resetAdminPassword = async () => {
    try {
        const newPassword = process.env.ROOT_ADMIN_PASSWORD || (process.env.NODE_ENV === 'production' ? '' : '26481#');
        if (process.env.NODE_ENV === 'production' && validatePassword(newPassword) !== true) {
            throw new Error('ROOT_ADMIN_PASSWORD não atende à política de segurança para produção.');
        }
        const hashedPassword = await bcrypt.hash(newPassword, 12);
        const [result] = await pool.execute('UPDATE usuarios SET senha = ? WHERE email = ?', [hashedPassword, ROOT_ADMIN_EMAIL]);
        if (result.affectedRows > 0) {
            console.log(`✅ Senha do administrador (${ROOT_ADMIN_EMAIL}) redefinida com sucesso!`);
        }
        else {
            console.log(`❌ Usuário ${ROOT_ADMIN_EMAIL} não encontrado`);
        }
        process.exit(0);
    }
    catch (error) {
        console.error('❌ Erro ao redefinir senha:', error);
        process.exit(1);
    }
};
resetAdminPassword();
