import request from 'supertest';
import { randomUUID, createHmac } from 'node:crypto';
import app from '../server.js';
import pool from '../config/database.js';
import { STATUS_CONTA, marcarAvisosDeInatividade, listarContasVinculadas } from '../infrastructure/Conta.js';
import { aplicarStatusPagamento, confirmarPagamentoPedido } from '../infrastructure/Pagamento.js';
import { marcarAlugueisVencidos } from '../infrastructure/Aluguel.js';

const ADMIN_EMAIL = process.env.ROOT_ADMIN_EMAIL || 'marcelo10@gmail.com';
const ADMIN_PASSWORD = process.env.ROOT_ADMIN_PASSWORD || '264810#';
const CLIENTE_SENHA = '123456#';

const criarCliente = async () => {
  const email = `rules-${randomUUID()}@example.test`;
  const response = await request(app)
    .post('/api/auth/register')
    .send({ nome: 'Cliente de Regras', email, senha: CLIENTE_SENHA });
  if (response.status !== 201) {
    throw new Error(`Falha ao criar cliente (${response.status}): ${JSON.stringify(response.body)}`);
  }
  return { email, id: response.body.data.user.id, token: response.body.data.accessToken };
};

const checkoutAluguel = async (token, itemId, dias = 7) => {
  const response = await request(app)
    .post('/api/pedidos/checkout')
    .set('Authorization', `Bearer ${token}`)
    .send({ items: [{ item_id: itemId, quantidade: 1, tipo: 'aluguel', dias_aluguel: dias }], metodo_pagamento: 'pix' });
  return response;
};

const alugueisDoUsuario = async (usuarioId) => {
  const [rows] = await pool.execute('SELECT * FROM alugueis WHERE usuario_id = ? ORDER BY id', [usuarioId]);
  return rows;
};

describe('Regras de negócio — pagamento, aluguel, conta e inatividade', () => {
  let adminToken = '';
  let rentalItemId = null;

  beforeAll(async () => {
    const adminLogin = await request(app).post('/api/auth/login').send({ email: ADMIN_EMAIL, senha: ADMIN_PASSWORD });
    adminToken = adminLogin.body.data.accessToken;
    expect(adminToken).toBeDefined();

    const [rows] = await pool.execute(
      'SELECT id FROM itens WHERE valor_aluguel_mensal > 0 LIMIT 1'
    );
    expect(rows.length).toBeGreaterThan(0);
    rentalItemId = rows[0].id;
  });

  afterAll(async () => {
    // Limpeza: remove aluguéis/eventos e depois os usuários de teste (pedidos em cascata).
    const [users] = await pool.query("SELECT id FROM usuarios WHERE email LIKE '%@example.test'");
    const ids = users.map((u) => u.id);
    if (ids.length > 0) {
      const ph = ids.map(() => '?').join(',');
      await pool.query(`DELETE FROM historico_eventos WHERE usuario_id IN (${ph}) OR registrado_por IN (${ph})`, [...ids, ...ids]);
      await pool.query(`DELETE FROM alugueis WHERE usuario_id IN (${ph})`, ids);
      await pool.query(`DELETE FROM usuarios WHERE id IN (${ph})`, ids);
    }
    await pool.end();
  });

  describe('Liberação apenas com pagamento confirmado (§7/§10)', () => {
    let cliente;
    let pedidoId;
    let aluguelId;

    beforeAll(async () => {
      cliente = await criarCliente();
      const checkout = await checkoutAluguel(cliente.token, rentalItemId);
      expect(checkout.status).toBe(201);
      pedidoId = checkout.body.data.id;
      expect(checkout.body.data.status_pagamento).toBe('pendente');

      const alugueis = await alugueisDoUsuario(cliente.id);
      expect(alugueis.length).toBe(1);
      expect(alugueis[0].status).toBe('aguardando_pagamento');
      expect(alugueis[0].data_inicio).toBeNull();
      aluguelId = alugueis[0].id;
    });

    test('não permite avançar o pedido sem pagamento (409)', async () => {
      const tentativa = await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pedido: 'processando' });
      expect(tentativa.status).toBe(409);
      expect(tentativa.body.message).toMatch(/pagamento/i);
    });

    test('confirmação manual libera o pedido e inicia o aluguel', async () => {
      const confirmacao = await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pagamento: 'confirmado' });
      expect(confirmacao.status).toBe(200);
      expect(confirmacao.body.data.status_pedido).toBe('processando');

      const [aluguel] = await alugueisDoUsuario(cliente.id);
      expect(aluguel.status).toBe('ativo');
      expect(aluguel.data_inicio).not.toBeNull();
      expect(aluguel.data_prevista_devolucao).not.toBeNull();
    });

    test('confirmação repetida é idempotente e não regrava o aluguel', async () => {
      const antes = await alugueisDoUsuario(cliente.id);
      const segunda = await confirmarPagamentoPedido({ pedidoId: Number(pedidoId) });
      expect(segunda.sucesso).toBe(true);
      expect(segunda.ja_confirmado).toBe(true);

      const regressao = await aplicarStatusPagamento({ pedidoId: Number(pedidoId), status_pagamento: 'pendente' });
      expect(regressao.sucesso).toBe(false);
      expect(regressao.reason).toBe('ja-confirmado');

      const depois = await alugueisDoUsuario(cliente.id);
      expect(depois[0].status).toBe(antes[0].status);
      expect(depois[0].data_inicio.getTime()).toBe(antes[0].data_inicio.getTime());
    });

    test('conclusão do pedido flui após o pagamento', async () => {
      const concluir = await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pedido: 'concluido' });
      expect(concluir.status).toBe(200);
    });
  });

  describe('Dias excedentes e regularização (§9-§11)', () => {
    let cliente;
    let aluguelId;

    beforeAll(async () => {
      cliente = await criarCliente();
      const checkout = await checkoutAluguel(cliente.token, rentalItemId);
      const pedidoId = checkout.body.data.id;
      await request(app)
        .put(`/api/pedidos/${pedidoId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pagamento: 'confirmado' });
      const [aluguel] = await alugueisDoUsuario(cliente.id);
      aluguelId = aluguel.id;
    });

    test('varredura marca vencidos com retirada pendente', async () => {
      await pool.execute(
        'UPDATE alugueis SET data_prevista_devolucao = DATE_SUB(NOW(), INTERVAL 10 DAY) WHERE id = ?',
        [aluguelId]
      );
      const resultado = await marcarAlugueisVencidos();
      expect(resultado.vencidos).toBeGreaterThanOrEqual(1);

      const [aluguel] = await alugueisDoUsuario(cliente.id);
      expect(aluguel.status).toBe('vencido');
      expect(aluguel.status_retirada).toBe('pendente');
    });

    test('regularização quita excedentes sem cobrança dupla', async () => {
      const criacao = await request(app)
        .post(`/api/alugueis/${aluguelId}/regularizacao`)
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ dias_adicionais: 0 });
      expect(criacao.status).toBe(201);
      expect(criacao.body.data.regularizacao.dias_excedentes).toBe(10);
      expect(Number(criacao.body.data.regularizacao.total)).toBeGreaterThan(0);
      const pedidoReg = criacao.body.data.id;

      // Ainda não paga: aluguel permanece vencido para o cliente.
      const [antesDePagar] = await alugueisDoUsuario(cliente.id);
      expect(antesDePagar.status).toBe('vencido');

      await request(app)
        .put(`/api/pedidos/${pedidoReg}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pagamento: 'confirmado' });

      const [aposPagar] = await alugueisDoUsuario(cliente.id);
      expect(aposPagar.status).toBe('regularizado');

      // Mesmos dias não podem ser cobrados duas vezes.
      const duplicada = await request(app)
        .post(`/api/alugueis/${aluguelId}/regularizacao`)
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ dias_adicionais: 0 });
      expect(duplicada.status).toBe(400);
    });

    test('regularização com extensão retoma o aluguel com novo prazo', async () => {
      await pool.execute(
        'UPDATE alugueis SET status = ?, data_prevista_devolucao = DATE_SUB(NOW(), INTERVAL 5 DAY) WHERE id = ?',
        ['vencido', aluguelId]
      );
      const criacao = await request(app)
        .post(`/api/alugueis/${aluguelId}/regularizacao`)
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ dias_adicionais: 5 });
      expect(criacao.status).toBe(201);
      expect(criacao.body.data.regularizacao.dias_cobrados).toBe(10);

      await request(app)
        .put(`/api/pedidos/${criacao.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_pagamento: 'confirmado' });

      const [aluguel] = await alugueisDoUsuario(cliente.id);
      expect(aluguel.status).toBe('ativo');
      expect(new Date(aluguel.data_prevista_devolucao).getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('Desativação preserva histórico e vínculo de identidade (§1-§5)', () => {
    let cliente;
    let pedidoAntigoId;

    beforeAll(async () => {
      cliente = await criarCliente();
      const checkout = await checkoutAluguel(cliente.token, rentalItemId);
      pedidoAntigoId = checkout.body.data.id;
    });

    test('desativação com pendências exige confirmação explícita', async () => {
      const tentativa = await request(app)
        .delete('/api/usuarios/me')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ senha_atual: CLIENTE_SENHA });
      expect(tentativa.status).toBe(409);
      expect(tentativa.body.errors.obrigacoes.possui_obrigacoes).toBe(true);
    });

    test('desativação preservou linhas de histórico e liberou o e-mail', async () => {
      const resposta = await request(app)
        .delete('/api/usuarios/me')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ senha_atual: CLIENTE_SENHA, confirmar_obrigacoes: true });
      expect(resposta.status).toBe(200);

      const [rows] = await pool.execute('SELECT * FROM usuarios WHERE id = ?', [cliente.id]);
      expect(rows.length).toBe(1);
      expect(rows[0].status_conta).toBe(STATUS_CONTA.DESATIVADA);
      expect(rows[0].ativo).toBe(0);
      expect(rows[0].email).not.toBe(cliente.email);
      expect(rows[0].email_original).toBe(cliente.email);

      const [pedidos] = await pool.execute('SELECT id FROM pedidos WHERE id = ?', [pedidoAntigoId]);
      expect(pedidos.length).toBe(1);
    });

    test('login da conta desativada devolve mensagem amigável', async () => {
      const resposta = await request(app)
        .post('/api/auth/login')
        .send({ email: cliente.email, senha: CLIENTE_SENHA });
      expect(resposta.status).toBe(403);
      expect(resposta.body.message).toMatch(/desativada/i);
    });

    test('re-cadastro sem prova de identidade é bloqueado', async () => {
      const semProva = await request(app)
        .post('/api/auth/register')
        .send({ nome: 'Clone sem prova', email: cliente.email, senha: '654321#' });
      expect(semProva.status).toBe(409);
      expect(semProva.body.errors.verificacao_conta_desativada).toBe(true);

      const senhaErrada = await request(app)
        .post('/api/auth/register')
        .send({ nome: 'Clone errado', email: cliente.email, senha: '654321#', senha_conta_desativada: 'senha-errada' });
      expect(senhaErrada.status).toBe(401);
    });

    test('re-cadastro com senha antiga recupera o histórico', async () => {
      const resposta = await request(app)
        .post('/api/auth/register')
        .send({ nome: 'Clone recuperado', email: cliente.email, senha: '654321#', senha_conta_desativada: CLIENTE_SENHA });
      expect(resposta.status).toBe(201);
      expect(resposta.body.data.recuperou_historico).toBe(true);

      const novoId = resposta.body.data.user.id;
      const vinculadas = await listarContasVinculadas(novoId);
      expect(vinculadas).toContain(cliente.id);

      const alugueis = await request(app)
        .get('/api/alugueis/me')
        .set('Authorization', `Bearer ${resposta.body.data.accessToken}`);
      expect(alugueis.status).toBe(200);
      expect(alugueis.body.data.alugueis.some((a) => a.pedido_id === pedidoAntigoId)).toBe(true);
    });

    test('e-mail diferente gera conta independente', async () => {
      const outro = await criarCliente();
      const pedidos = await request(app)
        .get('/api/pedidos/me')
        .set('Authorization', `Bearer ${outro.token}`);
      expect(pedidos.status).toBe(200);
      const lista = Array.isArray(pedidos.body.data) ? pedidos.body.data : pedidos.body.data.orders || pedidos.body.data.items || [];
      expect(lista.length).toBe(0);

      const eventos = await request(app)
        .get('/api/usuarios/me/eventos')
        .set('Authorization', `Bearer ${outro.token}`);
      expect(eventos.body.data.eventos.length).toBe(0);
    });
  });

  describe('Inatividade comercial de 6 meses — aviso sem bloqueio (§14-§16)', () => {
    test('cliente antigo sem movimento recebe aviso; compra recente remove', async () => {
      const cliente = await criarCliente();
      await pool.execute('UPDATE usuarios SET criado_em = DATE_SUB(NOW(), INTERVAL 8 MONTH) WHERE id = ?', [cliente.id]);

      await marcarAvisosDeInatividade();
      const [avisada] = await pool.execute('SELECT status_conta FROM usuarios WHERE id = ?', [cliente.id]);
      expect(avisada[0].status_conta).toBe(STATUS_CONTA.AVISO_INATIVIDADE);

      // Nada foi bloqueado: o cliente continua navegando e fazendo checkout.
      const itens = await request(app).get('/api/itens').set('Authorization', `Bearer ${cliente.token}`);
      expect(itens.status).toBe(200);

      const checkout = await checkoutAluguel(cliente.token, rentalItemId);
      expect(checkout.status).toBe(201);

      await marcarAvisosDeInatividade();
      const [reativada] = await pool.execute('SELECT status_conta FROM usuarios WHERE id = ?', [cliente.id]);
      expect(reativada[0].status_conta).toBe(STATUS_CONTA.ATIVO);
    });
  });

  describe('Webhook Mercado Pago — assinatura HMAC e idempotência (§50/§51)', () => {
    const PROVIDER_PAYMENT_ID = 'mp-test-123456';
    let cliente;
    let pedidoId;
    const originalFetch = global.fetch;

    const assinar = (ts, requestId) =>
      `ts=${ts},v1=${createHmac('sha256', 'webhook-secret')
        .update(`id:${PROVIDER_PAYMENT_ID};request-id:${requestId};ts:${ts};`)
        .digest('hex')}`;

    const enviarWebhook = async (signature) => {
      const headers = { 'x-request-id': 'req-1' };
      if (signature) headers['x-signature'] = signature;
      return request(app)
        .post('/api/pagamentos/webhook')
        .set(headers)
        .send({ type: 'payment', data: { id: PROVIDER_PAYMENT_ID } });
    };

    beforeAll(async () => {
      process.env.MP_ACCESS_TOKEN = 'test-token';
      process.env.MP_WEBHOOK_SECRET = 'webhook-secret';

      cliente = await criarCliente();
      const checkout = await checkoutAluguel(cliente.token, rentalItemId);
      pedidoId = checkout.body.data.id;
      await pool.execute(
        "UPDATE pedidos SET payment_provider = 'mercadopago', provider_payment_id = ? WHERE id = ?",
        [PROVIDER_PAYMENT_ID, pedidoId]
      );

      global.fetch = async () => ({
        ok: true,
        json: async () => ({
          id: PROVIDER_PAYMENT_ID,
          status: 'approved',
          external_reference: String(pedidoId),
        }),
      });
    });

    afterAll(async () => {
      global.fetch = originalFetch;
      delete process.env.MP_ACCESS_TOKEN;
      delete process.env.MP_WEBHOOK_SECRET;
    });

    test('rejeita evento sem assinatura válida', async () => {
      const semAssinatura = await enviarWebhook(null);
      expect(semAssinatura.status).toBe(401);

      const assinaturaErrada = await enviarWebhook('ts=123,v1=deadbeef');
      expect(assinaturaErrada.status).toBe(401);

      const [rows] = await pool.execute('SELECT status_pagamento FROM pedidos WHERE id = ?', [pedidoId]);
      expect(rows[0].status_pagamento).toBe('pendente');
    });

    test('confirma pagamento com assinatura válida e é idempotente em reenvio', async () => {
      const primeiro = await enviarWebhook(assinar(Date.now(), 'req-1'));
      expect(primeiro.status).toBe(200);

      const [pedido] = await pool.execute('SELECT * FROM pedidos WHERE id = ?', [pedidoId]);
      expect(pedido[0].status_pagamento).toBe('confirmado');
      expect(pedido[0].status_pedido).toBe('processando');

      const [alugueis] = await pool.execute('SELECT status FROM alugueis WHERE pedido_id = ?', [pedidoId]);
      expect(alugueis[0].status).toBe('ativo');

      const [eventos] = await pool.execute(
        "SELECT id FROM historico_eventos WHERE pedido_id = ? AND evento = 'pagamento_confirmado'",
        [pedidoId]
      );
      expect(eventos.length).toBe(1);

      // Reenvio do mesmo evento não pode duplicar efeito (§50).
      const segundo = await enviarWebhook(assinar(Date.now(), 'req-1'));
      expect(segundo.status).toBe(200);
      const [eventosDepois] = await pool.execute(
        "SELECT id FROM historico_eventos WHERE pedido_id = ? AND evento = 'pagamento_confirmado'",
        [pedidoId]
      );
      expect(eventosDepois.length).toBe(1);
    });
  });

  describe('RBAC das rotas de aluguel e alertas', () => {
    let cliente;

    beforeAll(async () => {
      cliente = await criarCliente();
    });

    test('cliente não acessa a operação nem atualiza retirada', async () => {
      const operacao = await request(app)
        .get('/api/alugueis/operacao')
        .set('Authorization', `Bearer ${cliente.token}`);
      expect(operacao.status).toBe(403);

      const retirada = await request(app)
        .put('/api/alugueis/1/retirada')
        .set('Authorization', `Bearer ${cliente.token}`)
        .send({ status_retirada: 'agendada' });
      expect(retirada.status).toBe(403);
    });

    test('admin atualiza retirada com enum validado', async () => {
      const invalido = await request(app)
        .put('/api/alugueis/1/retirada')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status_retirada: 'nao-existe' });
      expect(invalido.status).toBe(400);

      const [alugueis] = await pool.query("SELECT id FROM alugueis WHERE status = 'ativo' LIMIT 1");
      if (alugueis.length > 0) {
        const ok = await request(app)
          .put(`/api/alugueis/${alugueis[0].id}/retirada`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send({ status_retirada: 'agendada' });
        expect(ok.status).toBe(200);
      }
    });

    test('alertas do cliente refletem apenas pendências da própria conta', async () => {
      const alertas = await request(app)
        .get('/api/usuarios/me/alertas')
        .set('Authorization', `Bearer ${cliente.token}`);
      expect(alertas.status).toBe(200);
      expect(Array.isArray(alertas.body.data.alerts)).toBe(true);
    });
  });
});
