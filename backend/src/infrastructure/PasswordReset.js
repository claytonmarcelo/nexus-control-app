import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import pool from '../config/database.js';
import { ROOT_ADMIN_EMAIL } from '../config/access.js';

const hashToken = (token) => createHash('sha256').update(token).digest('hex');

export const createPasswordResetToken = async (email) => {
  const [users] = await pool.execute(
    'SELECT id, email FROM usuarios WHERE email = ? LIMIT 1',
    [email]
  );
  const user = users[0];

  if (!user || user.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
    return null;
  }

  const token = randomBytes(32).toString('hex');
  const tokenHash = hashToken(token);
  await pool.execute('DELETE FROM password_resets WHERE usuario_id = ?', [user.id]);
  await pool.execute(
    'INSERT INTO password_resets (usuario_id, token_hash, expira_em) VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 30 MINUTE))',
    [user.id, tokenHash]
  );

  return token;
};

export const resetPasswordWithToken = async (token, newPassword) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [resets] = await connection.execute(
      `SELECT pr.id, pr.usuario_id, u.email
       FROM password_resets pr
       INNER JOIN usuarios u ON u.id = pr.usuario_id
       WHERE pr.token_hash = ? AND pr.usado_em IS NULL AND pr.expira_em > NOW()
       LIMIT 1`,
      [hashToken(token)]
    );
    const reset = resets[0];

    if (!reset || reset.email.toLowerCase() === ROOT_ADMIN_EMAIL) {
      await connection.rollback();
      return false;
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await connection.execute('UPDATE usuarios SET senha = ? WHERE id = ?', [hashedPassword, reset.usuario_id]);
    await connection.execute('UPDATE password_resets SET usado_em = NOW() WHERE id = ?', [reset.id]);
    await connection.commit();
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
