import api from './api';

export const authService = {
  async forgotPassword(email) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token, senha) {
    const response = await api.post('/auth/reset-password', { token, senha });
    return response.data;
  },

  async login(email, password) {
    const response = await api.post('/auth/login', { email, senha: password });
    return response.data.data;
  },

  async register(data) {
    const response = await api.post('/auth/register', data);
    return response.data.data;
  },

  async refreshToken(refreshToken) {
    const response = await api.post('/auth/refresh', { refreshToken });
    return response.data.data;
  },

  async getMe() {
    const response = await api.get('/auth/me');
    return response.data.data.user;
  },

  async logout() {
    await api.post('/auth/logout');
  },
};

export const itemService = {
  async getAll(params = {}) {
    const response = await api.get('/itens', { params });
    return response.data.data;
  },

  async getMyItems() {
    const response = await api.get('/itens/my-items');
    return response.data.data;
  },

  async getById(id) {
    const response = await api.get(`/itens/${id}`);
    return response.data.data;
  },

  async getPermissions(id) {
    const response = await api.get(`/usuarios/${id}/permissions`);
    return response.data.data;
  },

  async updatePermissions(id, permissions) {
    const response = await api.put(`/usuarios/${id}/permissions`, { permissions });
    return response.data.data;
  },

  async create(data) {
    const response = await api.post('/itens', data);
    return response.data.data;
  },

  async update(id, data) {
    const response = await api.put(`/itens/${id}`, data);
    return response.data.data;
  },

  async delete(id) {
    const response = await api.delete(`/itens/${id}`);
    return response.data;
  },
  async negotiate(id, data) {
    const response = await api.post(`/itens/${id}/negotiate`, data);
    return response.data.data;
  },
  async getMyNegotiations() {
    const response = await api.get('/itens/my-negotiations');
    return response.data.data;
  },
};

export const userService = {
  async create(data) {
    const response = await api.post('/usuarios', data);
    return response.data.data;
  },

  async getAll(params = {}) {
    const response = await api.get('/usuarios', { params });
    return response.data.data;
  },

  async getById(id) {
    const response = await api.get(`/usuarios/${id}`);
    return response.data.data;
  },

  async update(id, data) {
    const response = await api.put(`/usuarios/${id}`, data);
    return response.data.data;
  },

  async delete(id) {
    const response = await api.delete(`/usuarios/${id}`);
    return response.data;
  },

  async changePassword(id, data) {
    const response = await api.put(`/usuarios/${id}/password`, data);
    return response.data;
  },
};

export const healthService = {
  async check() {
    const response = await api.get('/status');
    return response.data;
  },
};

export const checkoutService = {
  async create(data) {
    const response = await api.post('/pedidos/checkout', data);
    return response.data.data;
  },

  async getMyOrders(params = {}) {
    const response = await api.get('/pedidos/me', { params });
    return response.data.data;
  },

  async getOrderById(id) {
    const response = await api.get(`/pedidos/${id}`);
    return response.data.data;
  },

  async getAllOrders(params = {}) {
    const response = await api.get('/pedidos', { params });
    return response.data.data;
  },

  async updateOrder(id, data) {
    const response = await api.put(`/pedidos/${id}`, data);
    return response.data.data;
  },

  async deleteOrder(id) {
    const response = await api.delete(`/pedidos/${id}`);
    return response.data;
  },
};