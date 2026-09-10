import {
  createOrder,
  findOrderById,
  findOrdersByUserId,
  findAllOrders,
  updateOrderStatus,
  deleteOrder
} from '../models/Order.js';
import { findItemsByIds } from '../models/Item.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';

export const checkout = async (req, res) => {
  try {
    const { items, metodo_pagamento } = req.body;
    const usuario_id = req.user.id;

    if (!items || items.length === 0) {
      return sendError(res, 'Carrinho vazio', 400);
    }

    // Extrair IDs dos itens
    const itemIds = items.map(item => item.item_id);

    // Buscar itens reais do banco
    const realItems = (await findItemsByIds(itemIds)) as any[];

    if (realItems.length !== itemIds.length) {
      return sendError(res, 'Um ou mais itens não foram encontrados no banco', 400);
    }

    // Criar mapa de preços reais do banco
    const pricesMap = new Map();
    realItems.forEach((item: any) => {
      pricesMap.set(item.id, item.valor_venda);
    });

    // Validar e recalcular total com preços do banco
    let calculatedTotal = 0;
    const validatedItems = [];

    for (const item of items) {
      const realPrice = pricesMap.get(item.item_id);

      if (!realPrice || realPrice <= 0) {
        return sendError(res, `Item ${item.item_id} não tem preço válido configurado`, 400);
      }

      const quantidade = Math.floor(Number(item.quantidade) || 0);
      if (quantidade <= 0) {
        return sendError(res, `Quantidade inválida para item ${item.item_id}`, 400);
      }

      // Usar preço do banco, ignorar preço vindo do body
      const subtotal = realPrice * quantidade;
      calculatedTotal += subtotal;

      validatedItems.push({
        item_id: item.item_id,
        nome: item.nome || '',
        quantidade,
        preco_unitario: realPrice
      });
    }

    if (calculatedTotal <= 0) {
      return sendError(res, 'Total deve ser positivo', 400);
    }

    // Usar total calculado no servidor, ignorar total vindo do body
    const order = await createOrder({
      usuario_id,
      items: validatedItems,
      total: calculatedTotal,
      metodo_pagamento,
      status_pagamento: 'confirmado'
    });

    sendSuccess(res, order, 'Pedido criado com sucesso', 201);
  } catch (error) {
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
    if (req.user.nivel_acesso !== 'admin' && order.usuario_id !== req.user.id) {
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

export const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { status_pagamento, metodo_pagamento } = req.body;

    // Apenas admin pode atualizar pedidos
    if (req.user.nivel_acesso !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }

    const order = await findOrderById(id);
    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
    }

    const updated = await updateOrderStatus(id, {
      status_pagamento,
      metodo_pagamento
    });

    if (!updated) {
      return sendError(res, 'Não foi possível atualizar o pedido', 400);
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

    // Apenas admin pode deletar pedidos
    if (req.user.nivel_acesso !== 'admin') {
      return sendError(res, 'Acesso negado', 403);
    }

    const order = await findOrderById(id);
    if (!order) {
      return sendError(res, 'Pedido não encontrado', 404);
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
