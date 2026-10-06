import pool from '../config/database.js';
import { registrarEvento } from './EventLog.js';
import { iniciarAlugueisDoPedido, cancelarAlugueisDoPedido, aplicarRegularizacao } from './Aluguel.js';
/**
 * Regra central de pagamento (§7/§10): nenhum pedido é liberado, entregue ou
 * concluído sem pagamento confirmado. A confirmação SEMPRE ocorre aqui, no
 * backend — via webhook do gateway ou confirmação manual do administrador —
 * nunca por decisão do frontend.
 */
export const STATUS_PAGAMENTO = {
    PENDENTE: 'pendente',
    PROCESSANDO: 'processando',
    CONFIRMADO: 'confirmado',
    RECUSADO: 'recusado',
    CANCELADO: 'cancelado',
    FALHA: 'falha',
    ESTORNADO: 'estornado',
};
const STATUS_NAO_CONFIRMADOS = ['pendente', 'processando', 'recusado', 'cancelado', 'falha'];
/**
 * Confirma o pagamento do pedido de forma atômica e idempotente:
 * pedido + aluguéis + eventos no mesmo commit. Webhooks duplicados encontram
 * o pedido já 'confirmado' (ou batem no UNIQUE de provider_payment_id) e não
 * produzem efeito colateral (§50).
 */
export const confirmarPagamentoPedido = async ({ pedidoId, provider = null, providerPaymentId = null, confirmadoPor = null }) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [rows] = await connection.execute('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [pedidoId]);
        const order = rows[0];
        if (!order) {
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'not-found' };
        }
        if (order.status_pagamento === STATUS_PAGAMENTO.CONFIRMADO) {
            await connection.commit();
            transactionStarted = false;
            return { sucesso: true, ja_confirmado: true, pedido_id: Number(pedidoId) };
        }
        await connection.execute(`UPDATE pedidos
       SET status_pagamento = 'confirmado',
           status_pedido = 'processando',
           pago_confirmado_em = NOW(),
           payment_provider = COALESCE(?, payment_provider),
           provider_payment_id = COALESCE(?, provider_payment_id),
           confirmado_por = COALESCE(?, confirmado_por)
       WHERE id = ? AND status_pagamento <> 'confirmado'`, [provider, providerPaymentId, confirmadoPor, pedidoId]);
        const items = safeParseItems(order.items);
        await iniciarAlugueisDoPedido(order.id, connection);
        for (const item of items) {
            if (item.tipo === 'regularizacao_aluguel') {
                await aplicarRegularizacao(item, connection, order.id);
            }
        }
        await registrarEvento({
            usuarioId: order.usuario_id,
            pedidoId: Number(order.id),
            evento: 'pagamento_confirmado',
            descricao: 'Pagamento confirmado. Pedido liberado para processamento.',
            metadados: { provider, provider_payment_id: providerPaymentId, total: String(order.total), confirmado_por: confirmadoPor },
        }, connection);
        await connection.commit();
        transactionStarted = false;
        return { sucesso: true, pedido_id: Number(order.id) };
    }
    catch (error) {
        if (transactionStarted)
            await connection.rollback();
        // UNIQUE de provider_payment_id: webhook duplicado de outro pedido → ignora.
        if (error?.code === 'ER_DUP_ENTRY') {
            return { sucesso: true, duplicado: true, pedido_id: Number(pedidoId) };
        }
        throw error;
    }
    finally {
        connection.release();
    }
};
/**
 * Aplica um status NÃO confirmado ao pagamento (recusado, cancelado, falha,
 * estornado, processando) preservando o histórico e cancelando aluguéis que
 * ainda aguardavam pagamento.
 */
export const aplicarStatusPagamento = async ({ pedidoId, status_pagamento, provider = null, providerPaymentId = null, registradoPor = null }) => {
    if (status_pagamento === STATUS_PAGAMENTO.CONFIRMADO) {
        return confirmarPagamentoPedido({ pedidoId, provider, providerPaymentId, confirmadoPor: registradoPor });
    }
    if (!STATUS_NAO_CONFIRMADOS.includes(status_pagamento)) {
        return { sucesso: false, reason: 'status-invalido' };
    }
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [rows] = await connection.execute('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [pedidoId]);
        const order = rows[0];
        if (!order) {
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'not-found' };
        }
        // Pagamento já confirmado não regrava para 'pendente'/'processando' por engano;
        // apenas os estados terminais de estorno/cancelamento são permitidos.
        if (order.status_pagamento === STATUS_PAGAMENTO.CONFIRMADO && ['pendente', 'processando'].includes(status_pagamento)) {
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'ja-confirmado' };
        }
        await connection.execute(`UPDATE pedidos
       SET status_pagamento = ?,
           payment_provider = COALESCE(?, payment_provider),
           provider_payment_id = COALESCE(?, provider_payment_id)
       WHERE id = ?`, [status_pagamento, provider, providerPaymentId, pedidoId]);
        if (['recusado', 'cancelado', 'falha'].includes(status_pagamento)) {
            await cancelarAlugueisDoPedido(order.id, connection);
        }
        await registrarEvento({
            usuarioId: order.usuario_id,
            pedidoId: Number(order.id),
            evento: `pagamento_${status_pagamento}`,
            descricao: descricaoStatusPagamento(status_pagamento),
            metadados: { provider, provider_payment_id: providerPaymentId },
        }, connection);
        await connection.commit();
        transactionStarted = false;
        return { sucesso: true, pedido_id: Number(pedidoId), status_pagamento };
    }
    catch (error) {
        if (transactionStarted)
            await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
};
const descricaoStatusPagamento = (status) => ({
    processando: 'Pagamento em processamento pelo provedor.',
    recusado: 'Pagamento recusado. Pedido permanece não liberado.',
    cancelado: 'Pagamento cancelado. Pedido permanece não liberado.',
    falha: 'Falha ao processar o pagamento.',
    estornado: 'Pagamento estornado ao cliente.',
}[status] || 'Situação de pagamento atualizada.');
/**
 * Guarda de liberação (§10): o status operacional do pedido só avança com
 * pagamento confirmado. 'cancelado' é sempre permitido (decisão administrativa).
 */
export const atualizarStatusPedido = async ({ pedidoId, status_pedido, registradoPor }) => {
    const connection = await pool.getConnection();
    let transactionStarted = false;
    try {
        await connection.beginTransaction();
        transactionStarted = true;
        const [rows] = await connection.execute('SELECT * FROM pedidos WHERE id = ? FOR UPDATE', [pedidoId]);
        const order = rows[0];
        if (!order) {
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'not-found' };
        }
        if (status_pedido !== 'cancelado' && order.status_pagamento !== STATUS_PAGAMENTO.CONFIRMADO) {
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'pagamento-pendente' };
        }
        if (status_pedido === 'concluido' && order.status_pedido !== 'processando') {
            // Concluir exige que o pedido já tenha entrado em processamento (pago).
            await connection.rollback();
            transactionStarted = false;
            return { sucesso: false, reason: 'fluco-invalido' };
        }
        await connection.execute('UPDATE pedidos SET status_pedido = ? WHERE id = ?', [status_pedido, pedidoId]);
        await registrarEvento({ usuarioId: order.usuario_id, pedidoId: Number(pedidoId), evento: `pedido_${status_pedido}`, descricao: `Status operacional atualizado para '${status_pedido}'.`, registradoPor }, connection);
        await connection.commit();
        transactionStarted = false;
        return { sucesso: true };
    }
    catch (error) {
        if (transactionStarted)
            await connection.rollback();
        throw error;
    }
    finally {
        connection.release();
    }
};
export const encontrarPedidoPorPagamentoProvedor = async (providerPaymentId) => {
    const [rows] = await pool.execute('SELECT id, status_pagamento, provider_payment_id FROM pedidos WHERE provider_payment_id = ? LIMIT 1', [String(providerPaymentId)]);
    return rows[0] || null;
};
const safeParseItems = (raw) => {
    try {
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        return Array.isArray(parsed) ? parsed : [];
    }
    catch {
        return [];
    }
};
