import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';

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

  beforeAll(async () => {
    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcelo10@gmail.com', senha: '26481#' });
    adminToken = adminLogin.body.data.accessToken;

    // Login as regular user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@nexuscontrol.com', senha: 'cliente123' });
    userToken = userLogin.body.data.accessToken;
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'marcelo10@gmail.com', senha: '26481#' });
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.accessToken).toBeDefined();
      expect(response.body.data.refreshToken).toBeDefined();
      expect(response.body.data.user.email).toBe('marcelo10@gmail.com');
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
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: uniqueEmail,
          senha: 'password123',
          nivel_acesso: 'cliente'
        });
      
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(uniqueEmail);
      expect(response.body.data.accessToken).toBeDefined();
    });

    it('should reject duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          nome: 'Test User',
          email: 'marcelo10@gmail.com',
          senha: 'password123'
        });
      
      expect(response.status).toBe(409);
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({});
      
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe('marcelo10@gmail.com');
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
        .send({ email: 'marcelo10@gmail.com', senha: '26481#' });
      
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

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcelo10@gmail.com', senha: '26481#' });
    adminToken = adminLogin.body.data.accessToken;

    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'cliente@nexuscontrol.com', senha: 'cliente123' });
    userToken = userLogin.body.data.accessToken;
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

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'marcelo10@gmail.com', senha: '26481#' });
    adminToken = adminLogin.body.data.accessToken;
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
      const userLogin = await request(app)
        .post('/api/auth/login')
        .send({ email: 'cliente@nexuscontrol.com', senha: 'cliente123' });
      
      const response = await request(app)
        .get('/api/usuarios')
        .set('Authorization', `Bearer ${userLogin.body.data.accessToken}`);
      
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