import { createOrderWithRentals, findOrderById, findOrdersByUserId, findAllOrders, updateOrderStatus, deleteOrder, anexarPagamentoProvedor } from '../../infrastructure/Order.js';
import { findItemsByIds } from '../../infrastructure/Item.js';
import { findUserById } from '../../infrastructure/User.js';
import { sendSuccess, sendError, sendPaginated } from '../../utils/response.js';
import { STATUS_PAGAMENTO, aplicarStatusPagamento, atualizarStatusPedido, } from '../../infrastructure/Pagamento.js';
import { MIN_RENTAL_DAYS, MAX_RENTAL_DAYS, calcDailyRate, calcRentalTotal, round2, } from '../../infrastructure/Preco.js';
import { isMercadoPagoConfigurado, criarPagamentoPix, } from '../../infrastructure/payments/mercadopago.js';
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
        const itemIds = items.map((item) => item.item_id);
        const realItems = (await findItemsByIds(itemIds));
        if (realItems.length !== itemIds.length) {
            return sendError(res, 'Um ou mais itens não foram encontrados no banco', 400);
        }
        const itemsMap = new Map();
        realItems.forEach((item) => {
            itemsMap.set(item.id, item);
        });
        let calculatedTotal = 0;
        const validatedItems = [];
        for (const item of items) {
            const realItem = itemsMap.get(item.item_id);
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
        const pedido = await createOrderWithRentals({
            usuario_id,
            items: validatedItems,
            total: round2(calculatedTotal),
            metodo_pagamento: metodo_pagamento || 'pix',
            status_pagamento: STATUS_PAGAMENTO.PENDENTE,
        });
        // Gateway: com MP_ACCESS_TOKEN configurado, gera a cobrança Pix real.
        // Sem configuração, o pedido segue em modo manual — a confirmação é feita
        // pelo administrador, e em ambos os casos a liberação obedece a mesma regra.
        let pagamento = {
            provedor: 'manual',
            status: 'aguardando_confirmacao',
            mensagem: 'Seu pedido foi criado e aguarda a confirmação do pagamento para ser liberado.',
        };
        if (isMercadoPagoConfigurado() && pedido.metodo_pagamento === 'pix') {
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
            }
            catch (gatewayError) {
                console.error('[Checkout] Gateway indisponível, seguindo em modo manual:', gatewayError.message);
            }
        }
        const ordemCriada = await findOrderById(pedido.id);
        sendSuccess(res, { ...(ordemCriada || pedido), pagamento }, 'Pedido criado com sucesso', 201);
    }
    catch (error) {
        console.error('Erro ao criar pedido:', error);
        sendError(res, 'Erro ao processar checkout', 500);
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
    }
    catch (error) {
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
                if (resultado.reason === 'not-found')
                    return sendError(res, 'Pedido não encontrado', 404);
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
                if (resultado.reason === 'not-found')
                    return sendError(res, 'Pedido não encontrado', 404);
                return sendError(res, 'Não foi possível atualizar o status do pedido', 400);
            }
        }
        if (metodo_pagamento) {
            await updateOrderStatus(id, { metodo_pagamento });
        }
        const updatedOrder = await findOrderById(id);
        sendSuccess(res, updatedOrder, 'Pedido atualizado com sucesso');
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('Erro ao deletar pedido:', error);
        sendError(res, 'Erro ao deletar pedido', 500);
    }
};
