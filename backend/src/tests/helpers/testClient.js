import { randomUUID } from 'node:crypto';
import request from 'supertest';
import app from '../../server.js';
import pool from '../../config/database.js';

const TEST_CLIENT_PASSWORD = '123456#';

export const createTestClient = async () => {
  const email = `test-client-${randomUUID()}@example.test`;
  const response = await request(app)
    .post('/api/auth/register')
    .send({
      nome: 'Cliente temporário de teste',
      email,
      senha: TEST_CLIENT_PASSWORD,
    });

  if (response.status !== 201 || !response.body.data?.accessToken || !response.body.data?.user?.id) {
    throw new Error(
      `Não foi possível criar o cliente de teste (HTTP ${response.status}): ${response.body.message || 'resposta sem credenciais'}`,
    );
  }

  return {
    email,
    id: response.body.data.user.id,
    token: response.body.data.accessToken,
  };
};

export const deleteTestClient = async (userId) => {
  if (userId) {
    await pool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
  }
};
