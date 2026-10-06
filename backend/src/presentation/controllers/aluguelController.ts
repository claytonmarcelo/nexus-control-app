import {
  STATUS_RETIRADA,
  atualizarRetirada,
  calcularRegularizacao,
  listarAlugueisParaOperacao,
  listarAlugueisPorUsuarios,
} from '../../infrastructure/Aluguel.js';
import { listarContasVinculadas } from '../../infrastructure/Conta.js';
import { createOrderWithRentals, findOrderById } from '../../infrastructure/Order.js';
import { STATUS_PAGAMENTO } from '../../infrastructure/Pagamento.js';
import { MAX_RENTAL_DAYS, round2 } from '../../infrastructure/Preco.js';
import {
  criarPagamentoPix,
  isMercadoPagoConfigurado,
} from '../../infrastructure/payments/mercadopago.js';
import { anexarPagamentoProvedor } from '../../infrastructure/Order.js';
import { findUserById } from '../../infrastructure/User.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * GET /alugueis — visão do cliente. Inclui aluguéis de contas anteriores
 * vinculadas (recuperação de histórico §5), sempre calculados no backend.
 */
export const getMyRentals = async (req: any, res: any) => {
  try {
    const vinculos = await listarContasVinculadas(req.user.id);
    const alugueis = await listarAlugueisPorUsuarios([req.user.id, ...vinculos]);
    sendSuccess(res, { alugueis }, 'Aluguéis carregados');
  } catch (error) {
    console.error('Erro ao listar aluguéis do usuário:', error);
    sendError(res, 'Erro ao listar aluguéis', 500);
  }
};

/**
 * GET /alugueis?status=&vencidos=true — visão operacional (admin/funcionário)
 * para controle de devolução e retirada (§13/§14).
 */
export const getRentalsForOperation = async (req: any, res: any) => {
  try {
    const { status, vencidos, usuario } = req.query;
    const validStatuses = ['aguardando_pagamento', 'ativo', 'vencido', 'regularizado', 'devolvido', 'cancelado'];
    if (status && !validStatuses.includes(String(status))) {
      return sendError(res, 'Status de aluguel inválido', 400);
    }
    const alugueis = await listarAlugueisParaOperacao({
      status: status || undefined,
      vencidosAposRetiradaPendente: vencidos === 'true',
      usuarioId: usuario ? Number(usuario) : undefined,
    });
    sendSuccess(res, { alugueis }, 'Aluguéis carregados');
  } catch (error) {
    console.error('Erro ao listar aluguéis (operacao):', error);
    sendError(res, 'Erro ao listar aluguéis', 500);
  }
};

/**
 * POST /alugueis/:id/regularizacao — cria um pedido de pagamento dos dias
 * excedentes (+ dias futuros opcionais). TODO o valor é recalculado pelo
 * backend a partir do aluguel persistido; o cliente não envia preço (§17/§18).
 * O pedido segue o checkout existente: nasce 'pendente' e só libera/regulariza
 * na confirmação do pagamento (§10).
 */
export const createRegularizationOrder = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const diasAdicionais = req.body?.dias_adicionais;

    const resultado = await calcularRegularizacao(id, req.user.id, diasAdicionais);
    if (resultado.erro === 'not-found') return sendError(res, 'Aluguel não encontrado', 404);
    if (resultado.erro === 'status-invalido') {
      return sendError(res, 'Este aluguel não está pendente de regularização no momento.', 409);
    }
    if (resultado.erro === 'dias-invalidos') {
      return sendError(res, `Dias adicionais inválidos (0 a ${MAX_RENTAL_DAYS}).`, 400);
    }
    if (resultado.erro === 'nada-a-regularizar') {
      return sendError(res, 'Não há dias excedentes a quitar e nenhum dia adicional foi informado.', 400);
    }

    const { aluguel, regularizacao } = resultado;
    if (regularizacao.total <= 0) {
      return sendError(res, 'Valor de regularização inválido.', 400);
    }

    const pedido = await createOrderWithRentals({
      usuario_id: req.user.id,
      total: round2(regularizacao.total),
      metodo_pagamento: req.body?.metodo_pagamento || 'pix',
      status_pagamento: STATUS_PAGAMENTO.PENDENTE,
      items: [{
        item_id: aluguel.item_id,
        nome: `Regularização — ${aluguel.item_nome || 'aluguel'}`,
        quantidade: 1,
        preco_unitario: regularizacao.total,
        tipo: 'regularizacao_aluguel',
        aluguel_id: Number(aluguel.id),
        dias_excedentes: regularizacao.dias_excedentes,
        dias_adicionais: regularizacao.dias_adicionais,
      }],
    });

    let pagamento: any = {
      provedor: 'manual',
      status: 'aguardando_confirmacao',
      mensagem: 'Regularização criada e aguardando confirmação do pagamento.',
    };
    if (isMercadoPagoConfigurado() && pedido.metodo_pagamento === 'pix') {
      try {
        const dono = await findUserById(req.user.id);
        const mp = await criarPagamentoPix({ pedido, emailCliente: dono?.email });
        await anexarPagamentoProvedor(pedido.id, { provider: mp.provider, providerPaymentId: mp.provider_payment_id });
        pagamento = {
          provedor: mp.provider,
          status: mp.status,
          provider_payment_id: mp.provider_payment_id,
          qr_code: mp.qr_code,
          qr_code_base64: mp.qr_code_base64,
          ticket_url: mp.ticket_url,
          mensagem: 'Pague com o QR Code ou copia e cola. A regularização é aplicada automaticamente após a confirmação.',
        };
      } catch (gatewayError: any) {
        console.error('[Regularizacao] Gateway indisponível, seguindo em modo manual:', gatewayError.message);
      }
    }

    const ordemCriada = await findOrderById(pedido.id);
    sendSuccess(res, {
      regularizacao,
      ...(ordemCriada || pedido),
      pagamento,
    }, 'Regularização criada com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar regularização de aluguel:', error);
    sendError(res, 'Erro ao criar regularização', 500);
  }
};

const RETIRADAS_VALIDAS = Object.values(STATUS_RETIRADA);

/**
 * PUT /alugueis/:id/retirada — controle de retirada/devolução do equipamento
 * (§13/§14), restrito a admin e funcionário. Marcar 'realizada' conclui a
 * devolução no backend; o cliente é avisado via histórico/alertas.
 */
export const updatePickupStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status_retirada } = req.body || {};

    if (!RETIRADAS_VALIDAS.includes(status_retirada)) {
      return sendError(res, `Status de retirada inválido. Use: ${RETIRADAS_VALIDAS.join(', ')}`, 400);
    }

    const resultado = await atualizarRetirada(id, { status_retirada });
    if (resultado.erro === 'not-found') return sendError(res, 'Aluguel não encontrado', 404);

    sendSuccess(res, resultado, 'Retirada atualizada com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar retirada:', error);
    sendError(res, 'Erro ao atualizar retirada', 500);
  }
};
