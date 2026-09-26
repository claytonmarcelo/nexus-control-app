import { ItemRepository } from '../../domain/repositories/ItemRepository.js';
import { sendError, sendSuccess, sendPaginated } from '../../infrastructure/utils/response.js';
export class ItemUseCase {
    constructor(itemRepository) {
        this.itemRepository = itemRepository;
    }
    async createItem(data, userId, userRole) {
        const item = await this.itemRepository.create({
            ...data,
            criado_por: userId
        });
        return sendSuccess(null, { item: item.toJSON() }, 'Item criado com sucesso', 201);
    }
    async getAllItems({ page, limit }) {
        const result = await this.itemRepository.findAll({ page, limit });
        return sendPaginated(null, { items: result.items.map(item => item.toJSON()) }, page, limit, result.total, 'Itens listados com sucesso');
    }
    async getItemById(id) {
        const item = await this.itemRepository.findById(id);
        if (!item) {
            throw new Error('Item não encontrado');
        }
        return sendSuccess(null, { item: item.toJSON() }, 'Item encontrado');
    }
    async getItemsByUser(userId) {
        const items = await this.itemRepository.findByUser(userId);
        return sendSuccess(null, { items: items.map(item => item.toJSON()) }, 'Itens do usuário');
    }
    async updateItem(id, data, userId, userRole) {
        const canModify = await this.itemRepository.canUserModify(id, userId, userRole);
        if (!canModify) {
            throw new Error('Você não tem permissão para modificar este item');
        }
        await this.itemRepository.update(id, data);
        const updatedItem = await this.itemRepository.findById(id);
        return sendSuccess(null, { item: updatedItem.toJSON() }, 'Item atualizado com sucesso');
    }
    async deleteItem(id, userId, userRole) {
        const canModify = await this.itemRepository.canUserModify(id, userId, userRole);
        if (!canModify) {
            throw new Error('Você não tem permissão para excluir este item');
        }
        await this.itemRepository.delete(id);
        return sendSuccess(null, {}, 'Item excluído com sucesso');
    }
    async getItemsByIds(ids) {
        const items = await this.itemRepository.findByIds(ids);
        return sendSuccess(null, { items: items.map(item => item.toJSON()) }, 'Itens encontrados');
    }
}
