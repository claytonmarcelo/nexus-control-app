import { ItemUseCase } from '../../application/use-cases/ItemUseCase.js';
import { ItemRepository } from '../../domain/repositories/ItemRepository.js';
import pool from '../../infrastructure/config/database.js';
import { sendError } from '../../infrastructure/utils/response.js';

const itemRepository = new ItemRepository(pool);
const itemUseCase = new ItemUseCase(itemRepository);

export const create = async (req, res) => {
  try {
    const { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque } = req.body;
    const result = await itemUseCase.createItem(
      { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque },
      req.user.id,
      req.user.nivel_acesso
    );
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao criar item:', error);
    sendError(res, error.message || 'Erro interno do servidor', 500);
  }
};

export const getAll = async (req, res) => {
  try {
    const page = Number(req.query.page || 1);
    const limit = Number(req.query.limit || 20);
    const result = await itemUseCase.getAllItems({ page, limit });
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao listar itens:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const getById = async (req, res) => {
  try {
    const result = await itemUseCase.getItemById(req.params.id);
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao buscar item:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Item não encontrado' ? 404 : 500);
  }
};

export const getMyItems = async (req, res) => {
  try {
    const result = await itemUseCase.getItemsByUser(req.user.id);
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao buscar itens do usuário:', error);
    sendError(res, 'Erro interno do servidor', 500);
  }
};

export const update = async (req, res) => {
  try {
    const { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque } = req.body;
    const result = await itemUseCase.updateItem(
      req.params.id,
      { nome, descricao, categoria, fabricante, imagem_url, valor_venda, valor_aluguel_mensal, estoque },
      req.user.id,
      req.user.nivel_acesso
    );
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao atualizar item:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Você não tem permissão para modificar este item' ? 403 : 500);
  }
};

export const remove = async (req, res) => {
  try {
    const result = await itemUseCase.deleteItem(req.params.id, req.user.id, req.user.nivel_acesso);
    res.status(result.statusCode).json(result);
  } catch (error) {
    console.error('Erro ao excluir item:', error);
    sendError(res, error.message || 'Erro interno do servidor', error.message === 'Você não tem permissão para excluir este item' ? 403 : 500);
  }
};