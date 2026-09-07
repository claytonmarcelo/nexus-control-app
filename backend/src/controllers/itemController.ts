import {
  createItem,
  findAllItems,
  findItemById,
  findItemsByUser,
  updateItem,
  deleteItem,
  canUserModifyItem,
} from '../models/Item.js';
import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { createNegotiation, findNegotiationsByUser } from '../models/Negotiation.js';

export const create = async (req, res) => {
  try {
    const { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque } = req.body;
    const item = await createItem({ nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque, criado_por: req.user.id });
    sendSuccess(res, { item }, 'Item criado com sucesso', 201);
  } catch (error) {
    console.error('Erro ao criar item:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const negotiate = async (req, res) => {
  try {
    const result = await createNegotiation({ usuario_id: req.user.id, item_id: req.params.id, tipo: req.body.tipo, quantidade: Number(req.body.quantidade || 1) });
    if (result.error) return sendError(res, result.error, 400);
    sendSuccess(res, { negotiation: result }, 'Simulação registrada com sucesso', 201);
  } catch (error) {
    console.error('Erro ao simular negociação:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getMyNegotiations = async (req, res) => {
  try { sendSuccess(res, { negotiations: await findNegotiationsByUser(req.user.id) }, 'Suas simulações'); }
  catch (error) { sendError(res, 'Erro interno do servidor', 500); }
};

export const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await findAllItems({ page, limit });
    sendPaginated(res, { items: result.items }, page, limit, result.total, 'Itens listados com sucesso');
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getById = async (req, res) => {
  try {
    const item = await findItemById(req.params.id);
    if (!item) return sendError(res, 'Item não encontrado', 404);
    sendSuccess(res, { item }, 'Item encontrado');
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getMyItems = async (req, res) => {
  try {
    const items = await findItemsByUser(req.user.id);
    sendSuccess(res, { items }, 'Seus itens listados com sucesso');
  } catch (error) {
    console.error('Erro ao buscar seus itens:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const canModify = await canUserModifyItem(id, req.user.id, req.user.nivel_acesso);
    if (!canModify) return sendError(res, 'Sem permissão para modificar este item', 403);

    const updated = await updateItem(id, req.body);
    if (!updated) return sendError(res, 'Item não encontrado', 404);
    sendSuccess(res, { item: await findItemById(id) }, 'Item atualizado com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const canModify = await canUserModifyItem(id, req.user.id, req.user.nivel_acesso);
    if (!canModify) return sendError(res, 'Sem permissão para excluir este item', 403);

    const deleted = await deleteItem(id);
    if (!deleted) return sendError(res, 'Item não encontrado', 404);
    sendSuccess(res, null, 'Item excluído com sucesso');
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};
