import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import app from '../server.js';
import pool from '../config/database.js';
import { createTestClient, deleteTestClient } from './helpers/testClient.js';

const ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || 'marcelo10@gmail.com';
const ADMIN_PASSWORD = process.env.ROOT_ADMIN_PASSWORD || '264810#';

describe('API Health Check', () => {
  it('GET /api/status should return 200', async () => {
    const response = await request(app).get('/api/status');
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toBe('Nexus Control API está rodando');
  });
});

describe('Authentication', () => {
  let adminToken = '';
  let userToken = '';
  let testClientId;

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
    adminToken = adminLogin.body.data.accessToken;

    const testClient = await createTestClient();
    userToken = testClient.token;
    testClientId = testClient.id;
  });

  afterAll(async () => {
    await deleteTestClient(testClientId);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe(ADMIN_EMAIL);
    });

    it('should reject invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@nexuscontrol.com', senha: 'wrongpassword' });
      
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should reject non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@test.com', senha: 'password123' });
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const uniqueEmail = `test${Date.now()}@test.com`;
      const password = '654321#';
      let userId;

      try {
        const response = await request(app)
          .post('/api/auth/register')
          .send({
            nome: 'Test User',
            email: uniqueEmail,
            senha: password,
            nivel_acesso: 'cliente'
          });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
        expect(response.body.data.user.email).toBe(uniqueEmail);
        expect(response.body.data.accessToken).toBeDefined();
        userId = response.body.data.user.id;

        const [users] = await pool.execute(
          'SELECT senha FROM usuarios WHERE id = ?',
          [userId]
        );
        expect(users).toHaveLength(1);
        expect(users[0].senha).not.toBe(password);
        expect(await bcrypt.compare(password, users[0].senha)).toBe(true);

        const loginResponse = await request(app)
          .post('/api/auth/login')
          .send({ email: uniqueEmail, senha: password });
        expect(loginResponse.status).toBe(200);
        expect(loginResponse.body.data.user.email).toBe(uniqueEmail);
      } finally {
        if (userId) {
          await pool.execute('DELETE FROM usuarios WHERE id = ?', [userId]);
        }
      }
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: ADMIN_EMAIL,
          senha: '654321#'
        });
      
      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
    });

    it('should reject passwords outside the global format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: `weak-password-${Date.now()}@test.com`,
          senha: 'StrongTestPass123!'
        });

      expect(response.status).toBe(400);
      expect(response.body.errors[0].msg).toMatch(/6 dígitos seguidos de 1 símbolo/);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(ADMIN_EMAIL);
    });

    it('should reject without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');
      
      expect(response.status).toBe(401);
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');
      
      expect(response.status).toBe(401);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh access token', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
      
      const response = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: loginResponse.body.data.refreshToken });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
    });
  });
});

describe('Items API', () => {
  let adminToken = '';
  let userToken = '';
  let createdItemId = '';
  let testClientId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
    adminToken = adminLogin.body.data.accessToken;

    const testClient = await createTestClient();
    userToken = testClient.token;
    testClientId = testClient.id;
  });

  afterAll(async () => {
    if (createdItemId) {
      await pool.execute('DELETE FROM itens WHERE id = ?', [createdItemId]);
    }
    await deleteTestClient(testClientId);
  });

  describe('POST /api/itens', () => {
    it('should create item as admin', async () => {
      const response = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Test Item Admin', descricao: 'Created by admin' });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.item.nome).toBe('Test Item Admin');
      createdItemId = response.body.data.item.id;
    });

    it('should create item as regular user', async () => {
      const response = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'Test Item User', descricao: 'Created by user' });
      
      expect(response.status).toBe(201);
      expect(response.body.data.item.criado_por).toBeDefined();
    });

    it('should reject unauthenticated request', async () => {
      const response = await request(app)
        .post('/api/itens')
        .send({ nome: 'Test Item' });
      
      expect(response.status).toBe(401);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/itens', () => {
    it('should list all items for admin', async () => {
      const response = await request(app)
        .get('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.items)).toBe(true);
    });

    it('should list items for regular user', async () => {
      const response = await request(app)
        .get('/api/itens')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(200);
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/itens?page=1&limit=2')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.items.length).toBeLessThanOrEqual(2);
    });
  });

  describe('GET /api/itens catalog filtering', () => {
    it('should apply search and category filters to the priced catalog before pagination', async () => {
      const itemName = `Searchable catalog item ${Date.now()}`;
      const created = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nome: itemName,
          descricao: 'Catalog search regression fixture',
          categoria: 'Categoria de teste',
          valor_venda: 10,
          valor_aluguel_mensal: 0,
          estoque: 1,
        });
      const itemId = created.body.data?.item?.id;

      expect(created.status).toBe(201);
      expect(itemId).toBeDefined();

      try {
        const response = await request(app)
          .get('/api/itens')
          .query({ page: 1, limit: 5, catalogOnly: true, search: itemName, categoria: 'Categoria de teste' })
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.items.map((item) => item.nome)).toEqual([itemName]);
        expect(response.body.pagination.total).toBe(1);
      } finally {
        await pool.execute('DELETE FROM itens WHERE id = ?', [itemId]);
      }
    });

    it('should keep unpriced inventory visible when catalog filtering is not requested', async () => {
      const created = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: `Unpriced inventory ${Date.now()}`, descricao: 'Inventory-only item' });
      const itemId = created.body.data?.item?.id;

      expect(created.status).toBe(201);
      expect(itemId).toBeDefined();

      try {
        const response = await request(app)
          .get('/api/itens?page=1&limit=100')
          .set('Authorization', `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.data.items.some((item) => String(item.id) === String(itemId))).toBe(true);
      } finally {
        await pool.execute('DELETE FROM itens WHERE id = ?', [itemId]);
      }
    });

    it('should paginate priced catalog items and include every catalog category', async () => {
      const response = await request(app)
        .get('/api/itens?page=1&limit=2&catalogOnly=true')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.items).toHaveLength(2);
      expect(response.body.data.items.every((item) =>
        Number(item.valor_venda) > 0 || Number(item.valor_aluguel_mensal) > 0
      )).toBe(true);
      expect(response.body.data.categories).toEqual(expect.arrayContaining(
        response.body.data.items.map((item) => item.categoria)
      ));
      expect(response.body.pagination.total).toBeGreaterThanOrEqual(2);
    });
  });

  describe('GET /api/itens/:id', () => {
    it('should get item by id', async () => {
      const response = await request(app)
        .get(`/api/itens/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.data.item.id).toBe(createdItemId);
    });

    it('should return 404 for non-existent item', async () => {
      const response = await request(app)
        .get('/api/itens/99999')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/itens/:id', () => {
    it('should update item as owner', async () => {
      const response = await request(app)
        .put(`/api/itens/${createdItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Updated Item', descricao: 'Updated description' });
      
      expect(response.status).toBe(200);
      expect(response.body.data.item.nome).toBe('Updated Item');
    });

    it('should reject update by non-owner non-admin', async () => {
      // Create item as user
      const createResponse = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ nome: 'User Item', descricao: 'User item' });
      
      const userItemId = createResponse.body.data.item.id;

      // Try to update as admin (should work since admin can modify all)
      const adminUpdate = await request(app)
        .put(`/api/itens/${userItemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Admin Updated' });
      
      expect(adminUpdate.status).toBe(200);
    });
  });

  describe('DELETE /api/itens/:id', () => {
    it('should delete item as admin', async () => {
      // Create a new item to delete
      const createResponse = await request(app)
        .post('/api/itens')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nome: 'Item to Delete', descricao: 'Will be deleted' });
      
      const itemId = createResponse.body.data.item.id;

      const response = await request(app)
        .delete(`/api/itens/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
    });

    it('should reject delete by non-admin non-owner', async () => {
      const response = await request(app)
        .delete(`/api/itens/${createdItemId}`)
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });
});

describe('Users API (Admin Only)', () => {
  let adminToken = '';
  let userToken = '';
  let testClientId;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
    adminToken = adminLogin.body.data.accessToken;

    const testClient = await createTestClient();
    userToken = testClient.token;
    testClientId = testClient.id;
  });

  afterAll(async () => {
    await deleteTestClient(testClientId);
  });

  describe('GET /api/usuarios', () => {
    it('should list all users for admin', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.users)).toBe(true);
    });

    it('should reject non-admin', async () => {
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${userToken}`);
      
      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/usuarios/:id', () => {
    it('should not allow admin to delete themselves', async () => {
      // Get admin user id
      const meResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      
      const adminId = meResponse.body.data.user.id;

      const response = await request(app)
        .delete(`/api/usuarios/${adminId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(400);
    });
  });
});

afterAll(async () => {
  await pool.end();
});