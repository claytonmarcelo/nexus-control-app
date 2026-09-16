import pool from '../config/database.js';
import { ROOT_ADMIN_EMAIL, isRootAdmin } from '../config/access.js';
import { PAGE_PERMISSION_KEYS, getDefaultPermissions } from '../config/permissions.js';

export const getUserPermissions = async (userId, role, email) => {
  const defaults = isRootAdmin({ email })
    ? Object.fromEntries(PAGE_PERMISSION_KEYS.map((page) => [page, true]))
    : getDefaultPermissions(role);
  const [rows] = await pool.execute(
    'SELECT pagina, permitido FROM usuario_permissoes WHERE usuario_id = ?',
    [userId]
  );

  for (const row of rows) {
    if (PAGE_PERMISSION_KEYS.includes(row.pagina)) {
      defaults[row.pagina] = Boolean(row.permitido);
    }
  }

  return defaults;
};

export const setUserPermissions = async (userId, permissions) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute('DELETE FROM usuario_permissoes WHERE usuario_id = ?', [userId]);

    for (const page of PAGE_PERMISSION_KEYS) {
      await connection.execute(
        'INSERT INTO usuario_permissoes (usuario_id, pagina, permitido) VALUES (?, ?, ?)',
        [userId, page, permissions[page] ? 1 : 0]
      );
    }

    await connection.commit();
    return permissions;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

export const isPageAllowed = async (userId, role, email, page) => {
  const permissions = await getUserPermissions(userId, role, email);
  return permissions[page] === true;
};
