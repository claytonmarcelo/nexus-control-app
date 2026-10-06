import {
  createOrderWithRentals,
  findOrderById,
  findOrdersByUserId,
  findAllOrders,
  updateOrderStatus,
  deleteOrder,
  anexarPagamentoProvedor
} from '../../infrastructure/Order.js';
import { findItemsByIds } from '../../infrastructure/Item.js';
import { findUserById } from '../../infrastructure/User.js';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js';
import {
  STATUS_PAGAMENTO,
  aplicarStatusPagamento,
  atualizarStatusPedido,
} from '../../infrastructure/Pagamento.js';
import {
  MIN_RENTAL_DAYS,
  MAX_RENTAL_DAYS,
  calcDailyRate,
  calcRentalTotal,
  round2,
} from '../../infrastructure/Preco.js';
import {
  isMercadoPagoConfigurado,
  criarPagamentoPix,
} from '../../infrastructure/payments/mercadopago.js';

/**
 * Checkout: TODOS os valores são recalculados a partir do banco (preço de
 * venda, diária de aluguel por tier de permanência). O payload do cliente é
 * tratado apenas como intenção de compra (§52). O pedido nasce com
 * status_pagamento 'pendente' — liberação exige confirmação de pagamento (§7).
 */
export const checkout = async (req, res) => {
  try {
    const { items, metodo_pagamento } = req.body;
    const usuario_id = req.user.id;

    if (!items || items.length === 0) {
      return sendError(res, 'Carrinho vazio', 400);
    }

    const itemIds = items.map((item: any) => item.item_id);
    const realItems = (await findItemsByIds(itemIds)) as any[];

    if (realItems.length !== itemIds.length) {
      return sendError(res, 'Um ou mais itens não foram encontrados no banco', 400);
    }

    const itemsMap = new Map();
    realItems.forEach((item: any) => {
      itemsMap.set(item.id, item);
    });

    let calculatedTotal = 0;
    const validatedItems: any[] = [];

    for (const item of items) {
      const realItem: any = itemsMap.get(item.item_id);
      const quantidade = Math.floor(Number(item.quantidade) || 0);
      if (quantidade <= 0) {
        return sendError(res, `Quantidade inválida para item ${item.item_id}`, 400);
      }

      const ehAluguel = item.tipo === 'aluguel';

      if (ehAluguel) {
        const dias = Math.floor(Number(item.dias_aluguel) || 0);
        if (dias < MIN_RENTAL_DAYS || dias > MAX_RENTAL_DAYS) {
          return sendError(res, `Período de aluguel inválido para item ${item.item_id} (mínimo ${MIN_RENTAL_DAYS} dias)`, 400);
        }
        const valorMensal = Number(realItem?.valor_aluguel_mensal);
        if (!valorMensal || valorMensal <= 0) {
          return sendError(res, `Item ${item.item_id} não possui valor de aluguel configurado`, 400);
        }
        const valorDiario = round2(calcDailyRate(valorMensal, dias));
        const precoUnitario = round2(calcRentalTotal(valorMensal, dias));
        calculatedTotal += precoUnitario * quantidade;

        validatedItems.push({
          item_id: item.item_id,
          nome: realItem?.nome || item.nome || `Item #${item.item_id}`,
          quantidade,
          preco_unitario: precoUnitario,
          tipo: 'aluguel',
          dias_aluguel: dias,
          valor_diario: valorDiario,
        });
        continue;
      }

      const realPrice = Number(realItem?.valor_venda);
      if (!realPrice || realPrice <= 0) {
        return sendError(res, `Item ${item.item_id} não tem preço válido configurado`, 400);
      }
      const subtotal = realPrice * quantidade;
      calculatedTotal += subtotal;

      validatedItems.push({
        item_id: item.item_id,
        nome: realItem?.nome || item.nome || `Item #${item.item_id}`,
        quantidade,
        preco_unitario: realPrice,
        tipo: 'compra',
      });
    }

    if (calculatedTotal <= 0) {
      return sendError(res, 'Total deve ser positivo', 400);
    }

    const metodo = metodo_pagamento || 'pix';

    const pedido = await createOrderWithRentals({
      usuario_id,
      items: validatedItems,
      total: round2(calculatedTotal),
      metodo_pagamento: metodo,
      status_pagamento: STATUS_PAGAMENTO.PENDENTE,
    });

    // A regra de liberação continua integralmente no backend (§7/§10): o pedido
    // nasce 'pendente'. O que define se ele é confirmado na hora:
    //  - Pix COM gateway Mercado Pago configurado: gera a cobrança real (QR) e
    //    aguarda o webhook confirmar (único caminho que fica pendente).
    //  - Qualquer outro caso (sem gateway — modo fake/simulado da academia):
    //    o pagamento é confirmado AQUI mesmo, na hora, como era em 2026-10-03,
    //    disparando aluguéis/eventos pela mesma trilha atômica de confirmação.
    //    Isso vale para Pix e Cartão; o frontend nunca decide a liberação.
    let pagamento: any = {
      provedor: 'manual',
      status: 'aguardando_confirmacao',
      mensagem: 'Seu pedido foi criado e aguarda a confirmação do pagamento para ser liberado.',
    };

    if (metodo === 'pix' && isMercadoPagoConfigurado()) {
      try {
        const dono = await findUserById(usuario_id);
        const mp = await criarPagamentoPix({ pedido, emailCliente: dono?.email });
        await anexarPagamentoProvedor(pedido.id, { provider: mp.provider, providerPaymentId: mp.provider_payment_id });
        pagamento = {
          provedor: mp.provider,
          status: mp.status,
          provider_payment_id: mp.provider_payment_id,
          qr_code: mp.qr_code,
          qr_code_base64: mp.qr_code_base64,
          ticket_url: mp.ticket_url,
          mensagem: 'Pague com o QR Code ou copia e cola. A liberação ocorre automaticamente após a confirmação do pagamento.',
        };
      } catch (gatewayError: any) {
        console.error('[Checkout] Gateway indisponível, seguindo em modo manual:', gatewayError.message);
      }
    } else {
      // Sem gateway real: confirmação imediata no backend, pela mesma trilha
      // atômica usada na confirmação manual (libera pedido, inicia aluguéis,
      // registra evento). Comportamento padrão do modo simulado da academia.
      const provider = metodo === 'pix' ? 'fake' : 'manual';
      const confirmado = await aplicarStatusPagamento({
        pedidoId: Number(pedido.id),
        status_pagamento: STATUS_PAGAMENTO.CONFIRMADO,
        provider,
      });
      if (confirmado.sucesso) {
        pagamento = {
          provedor: provider,
          status: STATUS_PAGAMENTO.CONFIRMADO,
          mensagem: 'Pagamento confirmado! Seu pedido já está em processamento.',
        };
      }
    }

    const ordemCriada = await findOrderById(pedido.id);
    sendSuccess(res, { ...(ordemCriada || pedido), pagamento }, 'Pedido criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar pedido:', error);
    sendError(res, 'Erro ao processar checkout', 500);
  }
};

/**
 * Retomada de pagamento (Checkout `/checkout?pedido=ID`, a partir do alerta
 * "pagamento_pendente" no perfil): o dono do pedido — ou um admin/staff —
 * solicita a conclusão de um pedido que ainda está pendente.
 *
 * A regra continua integralmente no backend: só confirmamos NA HORA quando NÃO
 * há gateway real configurado (modo fake/simulado da academia, em que o Pix já
 * é confirmado no próprio checkout). Com o Mercado Pago ativo, a liberação vem
 * do provedor via webhook, então jamais auto-confirmamos por aqui. O frontend
 * apenas dispara a intenção; quem decide a liberação é este endpoint.
 */
export const payOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await findOrderById(id);
    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
    }

    const isOwner = String(order.usuario_id) === String(req.user.id);
    const isStaff = req.user.nivel_acesso === 'admin' || req.user.nivel_acesso === 'funcionario';
    if (!isOwner && !isStaff) {
      return sendError(res, 'Acesso negado', 403);
    }

    // Pagamento já liberado: idempotente, devolve o sucesso sem efeitos colaterais.
    if (order.status_pagamento === STATUS_PAGAMENTO.CONFIRMADO) {
      return sendSuccess(res, {
        ...order,
        pagamento: {
          provedor: order.payment_provider || 'fake',
          status: STATUS_PAGAMENTO.CONFIRMADO,
          mensagem: 'Pagamento confirmado! Seu pedido já está em processamento.',
        },
      }, 'Pagamento já confirmado');
    }

    // Estados terminais (recusado/cancelado/falha/estornado) exigem um novo
    // pedido; esta tela só conclui pedidos em aberto.
    if (!['pendente', 'processando'].includes(order.status_pagamento)) {
      return sendError(res, 'Este pedido não pode ser pago nesta tela. Refaça o pedido a partir do carrinho.', 409);
    }

    // Gateway real ativo: a confirmação depende do provedor/webhook, nunca daqui.
    if (isMercadoPagoConfigurado()) {
      return sendSuccess(res, {
        ...order,
        pagamento: {
          provedor: order.payment_provider || 'mercadopago',
          status: order.status_pagamento,
          mensagem: 'Assim que o pagamento for confirmado pelo banco, liberamos seu pedido automaticamente. Use "Já paguei — verificar".',
        },
      }, 'Aguardando confirmação do gateway');
    }

    // Modo simulado (sem gateway): confirma na hora pela mesma trilha atômica
    // do checkout — libera o pedido, inicia os aluguéis e registra o evento.
    const provider = order.metodo_pagamento === 'cartao' ? 'manual' : 'fake';
    const confirmado = await aplicarStatusPagamento({
      pedidoId: Number(order.id),
      status_pagamento: STATUS_PAGAMENTO.CONFIRMADO,
      provider,
      registradoPor: isStaff ? req.user.id : null,
    });

    if (!confirmado.sucesso) {
      return sendError(res, 'Não foi possível confirmar o pagamento agora. Tente novamente.', 400);
    }

    const fresh = await findOrderById(id);
    sendSuccess(res, {
      ...(fresh || order),
      pagamento: {
        provedor: provider,
        status: STATUS_PAGAMENTO.CONFIRMADO,
        mensagem: 'Pagamento confirmado! Seu pedido já está em processamento.',
      },
    }, 'Pagamento confirmado');
  } catch (error) {
    console.error('Erro ao retomar pagamento do pedido:', error);
    sendError(res, 'Erro ao confirmar pagamento', 500);
  }
};

export const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await findOrderById(id);

    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
    }

    // Verificar se o usuário é dono do pedido ou admin
    if (req.user.nivel_acesso !== 'admin' && String(order.usuario_id) !== String(req.user.id)) {
      return sendError(res, 'Acesso negado', 403);
    }

    sendSuccess(res, order, 'Pedido encontrado');
  } catch (error) {
    console.error('Erro ao buscar pedido:', error);
    sendError(res, 'Erro ao buscar pedido', 500);
  }
};

export const getUserOrders = async (req, res) => {
  try {
    const usuario_id = req.user.id;
    const { page = 1, limit = 20 } = req.query;

    const { orders, total } = await findOrdersByUserId(usuario_id, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    sendPaginated(res, orders, page, limit, total, 'Pedidos do usuário');
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário:', error);
    sendError(res, 'Erro ao buscar pedidos', 500);
  }
};

export const getAllOrders = async (req, res) => {
  try {
    // Apenas admin pode listar todos os pedidos
    if (req.user.nivel_acesso !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }

    const { page = 1, limit = 20 } = req.query;

    const { orders, total } = await findAllOrders({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    sendPaginated(res, orders, page, limit, total, 'Todos os pedidos');
  } catch (error) {
    console.error('Erro ao buscar pedidos:', error);
    sendError(res, 'Erro ao buscar pedidos', 500);
  }
};

export const getUserOrdersByAdmin = async (req, res) => {
  try {
    // Apenas admin pode consultar histórico de outro usuário
    if (req.user.nivel_acesso !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }

    const { userId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const { orders, total } = await findOrdersByUserId(userId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    sendPaginated(res, orders, page, limit, total, `Pedidos do usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao buscar pedidos do usuário (admin):', error);
    sendError(res, 'Erro ao buscar pedidos', 500);
  }
};

/**
 * Atualização administrativa de pedido. A confirmação de pagamento passa
 * pelo serviço Pagamento (transação + eventos + início de aluguéis), e o
 * status operacional é protegido pela regra de liberação (§10).
 */
export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pagamento, metodo_pagamento, status_pedido } = req.body;

    // Apenas admin pode atualizar pedidos
    if (req.user.nivel_acesso !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }

    const order = await findOrderById(id);
    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
    }

    if (status_pagamento) {
      const resultado = await aplicarStatusPagamento({
        pedidoId: Number(id),
        status_pagamento,
        provider: 'manual',
        registradoPor: req.user.id,
      });
      if (!resultado.sucesso) {
        if (resultado.reason === 'not-found') return sendError(res, 'Pedido não encontrado', 404);
        if (resultado.reason === 'ja-confirmado') {
          return sendError(res, 'Este pagamento já foi confirmado e não pode voltar a um estado anterior.', 409);
        }
        return sendError(res, 'Não foi possível atualizar o pagamento do pedido', 400);
      }
    }

    if (status_pedido) {
      const resultado = await atualizarStatusPedido({
        pedidoId: Number(id),
        status_pedido,
        registradoPor: req.user.id,
      });
      if (!resultado.sucesso) {
        if (resultado.reason === 'pagamento-pendente') {
          return sendError(res, 'O pedido somente pode ser liberado ou concluído com o pagamento confirmado.', 409);
        }
        if (resultado.reason === 'fluco-invalido') {
          return sendError(res, 'O pedido precisa estar em processamento antes de ser concluído.', 409);
        }
        if (resultado.reason === 'not-found') return sendError(res, 'Pedido não encontrado', 404);
        return sendError(res, 'Não foi possível atualizar o status do pedido', 400);
      }
    }

    if (metodo_pagamento) {
      await updateOrderStatus(id, { metodo_pagamento });
    }

    const updatedOrder = await findOrderById(id);
    sendSuccess(res, updatedOrder, 'Pedido atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar pedido:', error);
    sendError(res, 'Erro ao atualizar pedido', 500);
  }
};

export const deleteOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const order = await findOrderById(id);
    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
    }

    // Permitir se for admin OU se for o dono do pedido
    if (req.user.nivel_acesso !== 'admin' && String(req.user.id) !== String(order.usuario_id)) {
      return sendError(res, 'Acesso negado. Apenas o proprietário ou um administrador podem deletar este registro.', 403);
    }

    const deleted = await deleteOrder(id);
    if (!deleted) {
      return sendError(res, 'Não foi possível deletar o pedido', 400);
    }

    sendSuccess(res, null, 'Pedido deletado com sucesso');
  } catch (error) {
    console.error('Erro ao deletar pedido:', error);
    sendError(res, 'Erro ao deletar pedido', 500);
  }
};
