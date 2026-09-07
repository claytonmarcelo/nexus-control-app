import api from './api';

// Keep the admin API separate from the legacy services so the control centre
// can evolve without changing callers that still use /usuarios and /itens.
const unpack = (response) => response?.data?.data ?? response?.data ?? {};

export const adminService = {
  async getPages() {
    return unpack(await api.get('/admin/pages'));
  },

  async getOrders(params = {}) {
    return unpack(await api.get('/pedidos', { params }));
  },

  async getUserPermissions(userId) {
    return unpack(await api.get(`/usuarios/${userId}/permissions`));
  },

  async updatePermissions({ userId, nivel_acesso, ativo, permissions }) {
    return unpack(await api.put('/admin/permissions', {
      userId,
      nivel_acesso,
      ativo,
      permissions,
    }));
  },

  async updateOrderStatus(id, { status_pagamento, status_pedido }) {
    return unpack(await api.put(`/pedidos/${id}`, {
      status_pagamento,
      status_pedido,
    }));
  },
};

export default adminService;
