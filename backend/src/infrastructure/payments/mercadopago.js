import crypto from 'node:crypto';

/**
 * Adaptador Mercado Pago (gateway de pagamento do Nexus Control).
 * Sem SDK: usa a API REST v1 via fetch nativo, mantendo a stack enxuta e o
 * deploy AWS inalterado. As credenciais vêm exclusivamente do ambiente
 * (§96): MP_ACCESS_TOKEN e MP_WEBHOOK_SECRET; ausência delas = modo manual
 * (confirmação pelo administrador), sem quebrar o fluxo local.
 */

const API_BASE = process.env.MP_API_BASE || 'https://api.mercadopago.com';

export const isMercadoPagoConfigurado = () => Boolean(process.env.MP_ACCESS_TOKEN);

const mpHeaders = () => ({
  'Content-Type': 'application/json',
  'X-Access-Token': process.env.MP_ACCESS_TOKEN || '',
});

/**
 * Cria a cobrança Pix no gateway. O valor enviado é SEMPRE o total
 * recalculado no backend (§52). X-Idempotency-Key por pedido evita
 * cobrança dupla em retry (§50).
 */
export const criarPagamentoPix = async ({ pedido, emailCliente }) => {
  const notificationUrl = process.env.PUBLIC_URL
    ? `${process.env.PUBLIC_URL.replace(/\/$/, '')}/api/pagamentos/webhook`
    : undefined;

  const response = await fetch(`${API_BASE}/v1/payments`, {
    method: 'POST',
    headers: { ...mpHeaders(), 'X-Idempotency-Key': `nexus-pedido-${pedido.id}` },
    body: JSON.stringify({
      transaction_amount: Number(pedido.total),
      description: `Pedido #${pedido.id} - Nexus Control`,
      payment_method_id: 'pix',
      payer: { email: emailCliente },
      external_reference: String(pedido.id),
      ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      metadata: { pedido_id: pedido.id, origem: 'nexus-control' },
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error('[MP] Falha ao criar pagamento:', response.status, data?.message);
    throw new Error('Nao foi possivel iniciar o pagamento. Tente novamente.');
  }

  const transaction = data.point_of_interaction?.transaction_data || {};
  return {
    provider: 'mercadopago',
    provider_payment_id: String(data.id),
    status: data.status,
    qr_code: transaction.qr_code || null,
    qr_code_base64: transaction.qr_code_base64 || null,
    ticket_url: transaction.ticket_url || null,
  };
};

/** Reconsulta oficial do status — a webhook nunca é aceita de confiança (§51). */
export const consultarPagamento = async (paymentId) => {
  const response = await fetch(`${API_BASE}/v1/payments/${encodeURIComponent(paymentId)}`, {
    headers: mpHeaders(),
  });
  if (!response.ok) return null;
  return response.json();
};

/**
 * Valida a assinatura do webhook (x-signature: ts + v1 HMAC-SHA256 hex).
 * Sem MP_WEBHOOK_SECRET configurado, o webhook é rejeitado — confirmação
 * continua disponível apenas pelo caminho manual autenticado.
 */
export const verificarAssinaturaWebhook = (req, dataId) => {
  const secret = process.env.MP_WEBHOOK_SECRET;
  if (!secret) return false;

  const signatureHeader = req.get('x-signature') || '';
  const requestId = req.get('x-request-id') || '';
  const parts = Object.fromEntries(
    signatureHeader.split(',').map((piece) => piece.trim().split('='))
  );
  const ts = parts.ts;
  const v1 = parts.v1;
  if (!ts || !v1 || !dataId) return false;

  const template = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const esperado = crypto.createHmac('sha256', secret).update(template).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(v1));
  } catch {
    return false;
  }
};

/** Conversão dos estados do gateway para o ENUM existente de pedidos (§8). */
export const mapearStatusPagamentoMP = (statusMP) => ({
  approved: 'confirmado',
  pending: 'processando',
  in_process: 'processando',
  authorized: 'processando',
  in_mediation: 'processando',
  rejected: 'recusado',
  cancelled: 'cancelado',
  refunded: 'estornado',
  charged_back: 'estornado',
}[statusMP] || null);
