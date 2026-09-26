import { ROOT_ADMIN_EMAIL, isRootAdmin } from '../../infrastructure/config/access.js';
import { PAGE_PERMISSION_KEYS, getDefaultPermissions } from '../../infrastructure/config/permissions.js';
import pool from '../../infrastructure/config/database.js';
export class PermissionRepository {
    constructor(database) {
        this.database = database;
    }
    async getUserPermissions(userId, role, email) {
        const defaults = isRootAdmin({ email })
            ? Object.fromEntries(PAGE_PERMISSION_KEYS.map((page) => [page, true]))
            : getDefaultPermissions(role);
        const [rows] = await this.database.execute('SELECT pagina, permitido FROM usuario_permissoes WHERE usuario_id = ?', [userId]);
        for (const row of rows) {
            if (PAGE_PERMISSION_KEYS.includes(row.pagina)) {
                defaults[row.pagina] = Boolean(row.permitido);
            }
        }
        return defaults;
    }
    async setUserPermissions(userId, permissions) {
        const connection = await this.database.getConnection();
        try {
            await connection.beginTransaction();
            await connection.execute('DELETE FROM usuario_permissoes WHERE usuario_id = ?', [userId]);
            for (const page of PAGE_PERMISSION_KEYS) {
                await connection.execute('INSERT INTO usuario_permissoes (usuario_id, pagina, permitido) VALUES (?, ?, ?)', [userId, page, permissions[page] ? 1 : 0]);
            }
            await connection.commit();
            return permissions;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    }
    async isPageAllowed(userId, role, email, page) {
        const permissions = await this.getUserPermissions(userId, role, email);
        return permissions[page] === true;
    }
}
// Create a singleton instance for the export function
const permissionRepository = new PermissionRepository(pool);
export const isPageAllowed = async (userId, role, email, page) => {
    return await permissionRepository.isPageAllowed(userId, role, email, page);
};
