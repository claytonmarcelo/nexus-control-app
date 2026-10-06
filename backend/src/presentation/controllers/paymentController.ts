import { findOrderById } from '../../infrastructure/Order.js';
import {
  STATUS_PAGAMENTO,
  aplicarStatusPagamento,
  confirmarPagamentoPedido,
  encontrarPedidoPorPagamentoProvedor,
} from '../../infrastructure/Pagamento.js';
import {
  consultarPagamento,
  isMercadoPagoConfigurado,
  mapearStatusPagamentoMP,
  verificarAssinaturaWebhook,
} from '../../infrastructure/payments/mercadopago.js';
import { sendSuccess, sendError } from '../../utils/response.js';

/**
 * Webhook do Mercado Pago (§50/§51): a notificação nunca é aceita de confiança.
 * 1) valida a assinatura HMAC; 2) reconsulta o pagamento na API oficial;
 * 3) aplica o status autorizado pelo serviço Pagamento (transacional e
 * idempotente). Sempre responde 200 rápido para eventos irrelevantes, evitando
 * reenvios infinitos do gateway.
 */
export const webhook = async (req: any, res: any) => {
  try {
    if (!isMercadoPagoConfigurado()) {
      return res.status(200).json({ received: true, ignored: 'gateway-nao-configurado' });
    }

    const body: any = req.body || {};
    const topic = String(body.type || body.topic || '').toLowerCase();
    const dataId = body?.data?.id || (topic === 'payment' || topic === 'payments' ? body?.id : null) || body?.resource;

    if (!dataId) {
      return res.status(200).json({ received: true, ignored: 'sem-id' });
    }

    if (topic && topic !== 'payment' && topic !== 'payments') {
      return res.status(200).json({ received: true, ignored: `topico-${topic}` });
    }

    if (!verificarAssinaturaWebhook(req, String(dataId))) {
      console.warn('[Webhook MP] Assinatura ausente ou inválida — evento descartado');
      return sendError(res, 'Assinatura do webhook inválida', 401);
    }

    // Fonte autoritativa do status: a API do gateway, não o corpo da notificação.
    const payment = await consultarPagamento(String(dataId));
    if (!payment?.id) {
      return res.status(200).json({ received: true, ignored: 'pagamento-nao-encontrado' });
    }

    const status = mapearStatusPagamentoMP(payment.status);
    if (!status) {
      return res.status(200).json({ received: true, ignored: `status-${payment.status}` });
    }

    let pedido = await encontrarPedidoPorPagamentoProvedor(String(payment.id));
    if (!pedido && payment.external_reference) {
      pedido = await findOrderById(payment.external_reference);
    }
    if (!pedido) {
      console.warn('[Webhook MP] Pagamento sem pedido correspondente:', payment.id);
      return res.status(200).json({ received: true, ignored: 'pedido-nao-encontrado' });
    }

    const providerPaymentId = String(payment.id);
    const resultado = status === STATUS_PAGAMENTO.CONFIRMADO
      ? await confirmarPagamentoPedido({
          pedidoId: Number(pedido.id),
          provider: 'mercadopago',
          providerPaymentId,
        })
      : await aplicarStatusPagamento({
          pedidoId: Number(pedido.id),
          status_pagamento: status,
          provider: 'mercadopago',
          providerPaymentId,
        });

    if (!resultado.sucesso && resultado.reason !== 'not-found') {
      console.warn('[Webhook MP] Status não aplicado:', resultado.reason);
    }

    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error('[Webhook MP] Erro ao processar notificação:', error?.message);
    // 500 proposital: o gateway reenvia e a confirmação é idempotente.
    return sendError(res, 'Falha temporária ao processar o pagamento', 500);
  }
};

/**
 * Status de pagamento do pedido para o cliente acompanhar (Checkout "aguardando
 * confirmação"). Quando o gateway está configurado e o pagamento segue em
 * aberto, reconsulta o provedor — compensação para webhooks perdidos — sem
 * jamais confiar em decisão do frontend.
 */
export const getPaymentStatus = async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const order = await findOrderById(id);
    if (!order) return sendError(res, 'Pedido não encontrado', 404);

    const isOwner = String(order.usuario_id) === String(req.user.id);
    const isStaff = req.user.nivel_acesso === 'admin' || req.user.nivel_acesso === 'funcionario';
    if (!isOwner && !isStaff) return sendError(res, 'Acesso negado', 403);

    const pagamentoEmAberto = ['pendente', 'processando'].includes(order.status_pagamento);
    if (pagamentoEmAberto && isMercadoPagoConfigurado() && order.provider_payment_id) {
      try {
        const payment = await consultarPagamento(String(order.provider_payment_id));
        const mapped = payment ? mapearStatusPagamentoMP(payment.status) : null;
        if (mapped) {
          await aplicarStatusPagamento({
            pedidoId: Number(order.id),
            status_pagamento: mapped,
            provider: 'mercadopago',
            providerPaymentId: String(payment.id),
            registradoPor: req.user.nivel_acesso === 'admin' ? req.user.id : null,
          });
        }
      } catch (gatewayError: any) {
        console.warn('[PaymentStatus] Reconsulta do gateway falhou:', gatewayError.message);
      }
    }

    const fresh = (await findOrderById(id)) || order;
    sendSuccess(res, {
      pedido_id: Number(fresh.id),
      status_pagamento: fresh.status_pagamento,
      status_pedido: fresh.status_pedido,
      total: fresh.total,
      pago_confirmado_em: fresh.pago_confirmado_em ?? null,
      mensagem: mensagemStatus(fresh.status_pagamento),
    }, 'Status do pagamento');
  } catch (error) {
    console.error('Erro ao consultar status do pagamento:', error);
    sendError(res, 'Erro ao consultar status do pagamento', 500);
  }
};

const mensagemStatus = (status: string) => ({
  pendente: 'Aguardando pagamento. Seu pedido ainda não foi liberado.',
  processando: 'Pagamento em análise. A liberação é automática após a confirmação.',
  confirmado: 'Pagamento confirmado! Seu pedido está em processamento.',
  recusado: 'O pagamento foi recusado. Refaça o pagamento para liberar o pedido.',
  cancelado: 'O pagamento foi cancelado. Você pode refazer o pedido a qualquer momento.',
  falha: 'O pagamento não pôde ser processado. Tente novamente.',
  estornado: 'O pagamento foi estornado.',
}[status] || 'Situação do pagamento atualizada.');
