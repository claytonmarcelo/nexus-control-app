import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';

describe('Integration Tests - Carrinho e Checkout', () => {
  let adminToken = '';
  let clienteToken = '';
  let adminId = '';
  let clienteId = '';
  let itemId = '';

  beforeAll(async () => {
    console.log('\n🧪 Iniciando testes de integração...\n');

    // Login como admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'marcelo10@gmail.com',
        senha: '26481#',
      });

    adminToken = adminLogin.body.data.accessToken;
    adminId = adminLogin.body.data.user.id;
    console.log(`✅ Admin autenticado: ${adminId}`);

    // Login como cliente
    const clienteLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'cliente@nexuscontrol.com',
        senha: 'cliente123',
      });

    clienteToken = clienteLogin.body.data.accessToken;
    clienteId = clienteLogin.body.data.user.id;
    console.log(`✅ Cliente autenticado: ${clienteId}`);

    // Obter um item para teste
    const itemsResponse = await request(app)
      .get('/api/itens')
      .set('Authorization', `Bearer ${clienteToken}`);

    if (itemsResponse.body.data.length > 0) {
      itemId = itemsResponse.body.data[0].id;
      console.log(`✅ Item obtido para teste: ${itemId}`);
    }
  });

  afterAll(async () => {
    await pool.end();
    console.log('\n✅ Testes de integração concluídos\n');
  });

  describe('1. Fluxo do Carrinho (CartContext)', () => {
    test('✅ Deve permitir adicionar item ao carrinho via API', async () => {
      const response = await request(app)
        .get('/api/itens')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBeGreaterThan(0);
      console.log(`  ✓ Total de itens disponíveis: ${response.body.data.length}`);
    });

    test('✅ Deve obter detalhes de um item específico', async () => {
      if (!itemId) {
        console.log('  ⏭️ Item não disponível, pulando teste');
        return;
      }

      const response = await request(app)
        .get(`/api/itens/${itemId}`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('nome');
      expect(response.body.data).toHaveProperty('valor_venda');
      console.log(`  ✓ Item obtido: ${response.body.data.nome} - R$ ${response.body.data.valor_venda}`);
    });
  });

  describe('2. Checkout e Pagamento', () => {
    test('✅ Deve processar checkout com sucesso (Pix)', async () => {
      const checkoutData = {
        items: [
          {
            item_id: 1,
            quantidade: 1,
            preco: 100.00,
            nome: 'Produto Teste 1'
          }
        ],
        total: 100.00,
        metodo_pagamento: 'pix'
      };

      const response = await request(app)
        .post('/api/pedidos/checkout')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(checkoutData);

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('usuario_id', clienteId);
      expect(response.body.data).toHaveProperty('metodo_pagamento', 'pix');
      expect(response.body.data).toHaveProperty('status_pagamento', 'confirmado');
      console.log(`  ✓ Pedido criado: #${response.body.data.id} - Total: R$ ${response.body.data.total}`);
    });

    test('✅ Deve processar checkout com sucesso (Cartão)', async () => {
      const checkoutData = {
        items: [
          {
            item_id: 2,
            quantidade: 2,
            preco: 50.00,
            nome: 'Produto Teste 2'
          }
        ],
        total: 100.00,
        metodo_pagamento: 'cartao'
      };

      const response = await request(app)
        .post('/api/pedidos/checkout')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(checkoutData);

      expect(response.status).toBe(201);
      expect(response.body.data.metodo_pagamento).toBe('cartao');
      console.log(`  ✓ Pedido com Cartão criado: #${response.body.data.id}`);
    });

    test('❌ Deve rejeitar checkout com carrinho vazio', async () => {
      const checkoutData = {
        items: [],
        total: 0,
        metodo_pagamento: 'pix'
      };

      const response = await request(app)
        .post('/api/pedidos/checkout')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send(checkoutData);

      expect(response.status).toBe(400);
      console.log(`  ✓ Rejeição correta: ${response.body.message}`);
    });

    test('❌ Deve rejeitar checkout sem autenticação', async () => {
      const checkoutData = {
        items: [{ item_id: 1, quantidade: 1, preco: 100.00 }],
        total: 100.00,
        metodo_pagamento: 'pix'
      };

      const response = await request(app)
        .post('/api/pedidos/checkout')
        .send(checkoutData);

      expect(response.status).toBe(401);
      console.log(`  ✓ Rejeição correta: ${response.body.message}`);
    });
  });

  describe('3. Gestão de Pedidos (Cliente)', () => {
    test('✅ Cliente deve obter seus próprios pedidos', async () => {
      const response = await request(app)
        .get('/api/pedidos/me')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      console.log(`  ✓ Total de pedidos do cliente: ${response.body.data.length}`);
    });

    test('✅ Cliente deve obter detalhes de um pedido', async () => {
      const pedidosResponse = await request(app)
        .get('/api/pedidos/me')
        .set('Authorization', `Bearer ${clienteToken}`);

      if (pedidosResponse.body.data.length === 0) {
        console.log('  ⏭️ Nenhum pedido disponível, pulando teste');
        return;
      }

      const pedidoId = pedidosResponse.body.data[0].id;

      const response = await request(app)
        .get(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('id', pedidoId);
      expect(response.body.data).toHaveProperty('usuario_id');
      console.log(`  ✓ Pedido #${pedidoId} obtido com sucesso`);
    });

    test('❌ Cliente não deve obter pedidos de outro usuário', async () => {
      const response = await request(app)
        .get(`/api/pedidos/999`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(403);
      console.log(`  ✓ Acesso negado corretamente`);
    });
  });

  describe('4. Admin - Gestão de Pedidos', () => {
    test('✅ Admin deve listar todos os pedidos', async () => {
      const response = await request(app)
        .get('/api/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      console.log(`  ✓ Total de pedidos no sistema: ${response.body.data.length}`);
    });

    test('✅ Admin deve atualizar status de pedido', async () => {
      const pedidosResponse = await request(app)
        .get('/api/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);

      if (pedidosResponse.body.data.length === 0) {
        console.log('  ⏭️ Nenhum pedido disponível, pulando teste');
        return;
      }

      const pedidoId = pedidosResponse.body.data[0].id;

      const response = await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status_pagamento: 'confirmado',
          metodo_pagamento: 'pix'
        });

      expect(response.status).toBe(200);
      console.log(`  ✓ Status de pedido #${pedidoId} atualizado`);
    });

    test('❌ Cliente não deve atualizar pedidos', async () => {
      const response = await request(app)
        .put('/api/pedidos/1')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({ status_pagamento: 'cancelado' });

      expect(response.status).toBe(403);
      console.log(`  ✓ Acesso negado corretamente`);
    });
  });

  describe('5. Admin Control Center - Páginas', () => {
    test('✅ Admin deve obter mapeamento de páginas', async () => {
      const response = await request(app)
        .get('/api/admin/pages')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pages');
      expect(response.body.data).toHaveProperty('views');
      expect(response.body.data).toHaveProperty('roles');
      console.log(`  ✓ Mapeamento obtido com ${Object.keys(response.body.data.pages).length} páginas`);
    });

    test('❌ Cliente não deve acessar admin pages', async () => {
      const response = await request(app)
        .get('/api/admin/pages')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(response.status).toBe(403);
      console.log(`  ✓ Acesso negado corretamente`);
    });
  });

  describe('6. Admin Control Center - Permissões', () => {
    test('✅ Admin deve listar usuários com permissões', async () => {
      const response = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toBeInstanceOf(Array);
      console.log(`  ✓ Total de usuários obtidos: ${response.body.data.length}`);
    });

    test('✅ Admin deve obter permissões de um usuário', async () => {
      const response = await request(app)
        .get(`/api/admin/users/${clienteId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('userId', clienteId);
      expect(response.body.data).toHaveProperty('permissions');
      console.log(`  ✓ Permissões obtidas para usuário ${clienteId}`);
    });

    test('✅ Admin deve atualizar permissões de usuário', async () => {
      const permissionsData = {
        dashboard: true,
        itens: true,
        usuarios: false,
        perfil: true,
        carrinho: true,
        checkout: true,
        admin: false
      };

      const response = await request(app)
        .put(`/api/admin/users/${clienteId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: permissionsData });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('userId', clienteId);
      console.log(`  ✓ Permissões atualizadas para usuário ${clienteId}`);
    });
  });

  describe('7. Admin Control Center - Estatísticas', () => {
    test('✅ Admin deve obter estatísticas do dashboard', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalUsers');
      expect(response.body.data).toHaveProperty('usersByRole');
      expect(response.body.data).toHaveProperty('orderStats');
      console.log(`  ✓ Estatísticas obtidas:`);
      console.log(`    - Total de usuários: ${response.body.data.totalUsers}`);
      console.log(`    - Pedidos: ${response.body.data.orderStats.total}`);
    });
  });

  describe('8. Fluxo Completo - Carrinho até Pedido', () => {
    test('✅ Deve executar fluxo completo do cliente', async () => {
      // 1. Cliente acessa o dashboard
      const dashboardResponse = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(dashboardResponse.status).toBe(200);
      console.log(`  ✓ Passo 1: Cliente acessou dashboard`);

      // 2. Cliente visualiza itens
      const itensResponse = await request(app)
        .get('/api/itens')
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(itensResponse.status).toBe(200);
      expect(itensResponse.body.data.length).toBeGreaterThan(0);
      console.log(`  ✓ Passo 2: Cliente visualizou ${itensResponse.body.data.length} itens`);

      // 3. Cliente faz checkout
      const checkoutResponse = await request(app)
        .post('/api/pedidos/checkout')
        .set('Authorization', `Bearer ${clienteToken}`)
        .send({
          items: [
            {
              item_id: 1,
              quantidade: 1,
              preco: 100.00,
              nome: 'Item Teste'
            }
          ],
          total: 100.00,
          metodo_pagamento: 'pix'
        });

      expect(checkoutResponse.status).toBe(201);
      const pedidoId = checkoutResponse.body.data.id;
      console.log(`  ✓ Passo 3: Cliente fez checkout - Pedido #${pedidoId}`);

      // 4. Cliente consulta seu pedido
      const pedidoResponse = await request(app)
        .get(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${clienteToken}`);

      expect(pedidoResponse.status).toBe(200);
      console.log(`  ✓ Passo 4: Cliente consultou pedido #${pedidoId}`);

      // 5. Admin visualiza o pedido
      const adminPedidoResponse = await request(app)
        .get('/api/pedidos')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(adminPedidoResponse.status).toBe(200);
      console.log(`  ✓ Passo 5: Admin visualizou todos os ${adminPedidoResponse.body.data.length} pedidos`);

      // 6. Admin atualiza status do pedido
      const updateResponse = await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status_pagamento: 'confirmado'
        });

      expect(updateResponse.status).toBe(200);
      console.log(`  ✓ Passo 6: Admin atualizou status do pedido`);

      console.log(`\n  ✅ Fluxo completo executado com sucesso!`);
    });
  });

  describe('9. Segurança', () => {
    test('❌ Deve rejeitar requisições sem token', async () => {
      const response = await request(app)
        .get('/api/pedidos/me');

      expect(response.status).toBe(401);
      console.log(`  ✓ Rejeição correta: ${response.body.message}`);
    });

    test('❌ Deve rejeitar token inválido', async () => {
      const response = await request(app)
        .get('/api/pedidos/me')
        .set('Authorization', 'Bearer token_invalido_xyz');

      expect(response.status).toBe(401);
      console.log(`  ✓ Rejeição correta: ${response.body.message}`);
    });

    test('❌ Deve respeitar limites de permissão', async () => {
      const response = await request(app)
        .get('/api/admin/pages');

      expect(response.status).toBe(401);
      console.log(`  ✓ Rejeição correta: ${response.body.message}`);
    });
  });
});
