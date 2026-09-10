import { sendSuccess, sendError, sendPaginated } from '../utils/response.js';
import { findAllUsers } from '../models/User.js';
import { getUserPermissions, setUserPermissions } from '../models/Permission.js';
import { findAllOrders } from '../models/Order.js';
import { findAllItems } from '../models/Item.js';
import { PAGE_PERMISSIONS, DEFAULT_PERMISSIONS, PAGE_PERMISSION_KEYS } from '../config/permissions.js';
import { isRootAdmin } from '../config/access.js';
import pool from '../config/database.js';

// Mapeamento de páginas e suas metadatas
const PAGES_MAP = {
  [PAGE_PERMISSIONS.DASHBOARD]: {
    name: 'Dashboard',
    description: 'Acesso ao painel principal e visualização de dados',
    icon: 'chart-bar'
  },
  [PAGE_PERMISSIONS.ITENS]: {
    name: 'Itens',
    description: 'Gerenciar catálogo de produtos e serviços',
    icon: 'box'
  },
  [PAGE_PERMISSIONS.USUARIOS]: {
    name: 'Usuários',
    description: 'Gerenciar usuários e controle de acesso',
    icon: 'users'
  },
  [PAGE_PERMISSIONS.PERFIL]: {
    name: 'Perfil',
    description: 'Editar dados e preferências pessoais',
    icon: 'user'
  },
  [PAGE_PERMISSIONS.CARRINHO]: {
    name: 'Carrinho de Compras',
    description: 'Acessar carrinho de compras',
    icon: 'shopping-cart'
  },
  [PAGE_PERMISSIONS.CHECKOUT]: {
    name: 'Checkout',
    description: 'Realizar checkout e processamento de pagamento',
    icon: 'credit-card'
  },
  [PAGE_PERMISSIONS.ADMIN]: {
    name: 'Painel Administrativo',
    description: 'Acesso ao painel de controle administrativo completo',
    icon: 'shield-admin'
  }
};

// Rotas e componentes mapeados por role
const VIEWS_MAP = {
  admin: {
    label: 'Visualização Admin',
    pages: [
      { key: PAGE_PERMISSIONS.DASHBOARD, component: 'Dashboard', title: 'Dashboard Admin' },
      { key: PAGE_PERMISSIONS.ITENS, component: 'ItemsManagement', title: 'Gerenciar Itens' },
      { key: PAGE_PERMISSIONS.USUARIOS, component: 'UsersManagement', title: 'Gerenciar Usuários' },
      { key: PAGE_PERMISSIONS.PERFIL, component: 'Profile', title: 'Meu Perfil' },
      { key: PAGE_PERMISSIONS.CARRINHO, component: 'Cart', title: 'Carrinho de Compras' },
      { key: PAGE_PERMISSIONS.CHECKOUT, component: 'Checkout', title: 'Checkout' },
      { key: PAGE_PERMISSIONS.ADMIN, component: 'AdminControlCenter', title: 'Painel de Controle' }
    ]
  },
  funcionario: {
    label: 'Visualização Funcionário',
    pages: [
      { key: PAGE_PERMISSIONS.DASHBOARD, component: 'Dashboard', title: 'Dashboard Funcionário' },
      { key: PAGE_PERMISSIONS.ITENS, component: 'ItemsList', title: 'Catálogo de Itens' },
      { key: PAGE_PERMISSIONS.PERFIL, component: 'Profile', title: 'Meu Perfil' },
      { key: PAGE_PERMISSIONS.CARRINHO, component: 'Cart', title: 'Carrinho de Compras' },
      { key: PAGE_PERMISSIONS.CHECKOUT, component: 'Checkout', title: 'Checkout' }
    ]
  },
  cliente: {
    label: 'Visualização Cliente',
    pages: [
      { key: PAGE_PERMISSIONS.DASHBOARD, component: 'Dashboard', title: 'Dashboard Cliente' },
      { key: PAGE_PERMISSIONS.ITENS, component: 'ItemsList', title: 'Catálogo de Itens' },
      { key: PAGE_PERMISSIONS.PERFIL, component: 'Profile', title: 'Meu Perfil' },
      { key: PAGE_PERMISSIONS.CARRINHO, component: 'Cart', title: 'Carrinho de Compras' },
      { key: PAGE_PERMISSIONS.CHECKOUT, component: 'Checkout', title: 'Checkout' }
    ]
  }
};

export const getPages = async (req, res) => {
  try {
    const response = {
      pages: PAGES_MAP,
      views: VIEWS_MAP,
      roles: {
        admin: {
          label: 'Administrador',
          description: 'Acesso total a todas as funcionalidades'
        },
        funcionario: {
          label: 'Funcionário',
          description: 'Acesso a funcionalidades básicas e catálogo'
        },
        cliente: {
          label: 'Cliente',
          description: 'Acesso ao catálogo e compras'
        }
      },
      defaultPermissions: DEFAULT_PERMISSIONS
    };

    sendSuccess(res, response, 'Mapeamento de páginas e acessos');
  } catch (error) {
    console.error('Erro ao obter páginas:', error);
    sendError(res, 'Erro ao obter páginas', 500);
  }
};

export const getUserPermissionsById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Buscar permissões do usuário
    const [userRows] = await pool.execute(
      'SELECT id, nome, email, nivel_acesso FROM usuarios WHERE id = ?',
      [userId]
    );

    if ((userRows as any[]).length === 0) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    const user = (userRows as any[])[0];
    const permissions = await getUserPermissions(userId, user.nivel_acesso, user.email);

    sendSuccess(res, {
      userId: user.id,
      nome: user.nome,
      email: user.email,
      nivel_acesso: user.nivel_acesso,
      permissions
    }, 'Permissões do usuário');
  } catch (error) {
    console.error('Erro ao obter permissões do usuário:', error);
    sendError(res, 'Erro ao obter permissões', 500);
  }
};

export const updateUserPermissions = async (req, res) => {
  try {
    const { userId } = req.params;
    const { permissions } = req.body;

    if (!permissions || typeof permissions !== 'object') {
      return sendError(res, 'permissions deve ser um objeto válido', 400);
    }

    // Validar que todas as páginas têm valores booleanos
    for (const page of PAGE_PERMISSION_KEYS) {
      if (permissions[page] !== undefined && typeof permissions[page] !== 'boolean') {
        return sendError(res, `permission[${page}] deve ser booleano`, 400);
      }
    }

    // Verificar se usuário existe
    const [userRows] = await pool.execute(
      'SELECT id, nome, email FROM usuarios WHERE id = ?',
      [userId]
    );

    if ((userRows as any[]).length === 0) {
      return sendError(res, 'Usuário não encontrado', 404);
    }

    const targetUser = (userRows as any[])[0];

    // Proteger root admin: não permitir alteração de permissões
    if (isRootAdmin(targetUser)) {
      return sendError(res, 'Não é possível alterar as permissões do administrador principal', 403);
    }

    // Atualizar permissões
    await setUserPermissions(userId, permissions);

    const updatedPermissions = await getUserPermissions(userId, targetUser.nivel_acesso, targetUser.email);

    sendSuccess(res, {
      userId,
      nome: targetUser.nome,
      email: targetUser.email,
      permissions: updatedPermissions
    }, 'Permissões atualizadas com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar permissões:', error);
    sendError(res, 'Erro ao atualizar permissões', 500);
  }
};

export const getAllUsersWithPermissions = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = ((page as number) - 1) * (limit as number);

    const users = await findAllUsers() as any[];
    const totalUsers = users.length;

    // Paginar manualmente
    const paginatedUsers = users.slice(offset, offset + parseInt(limit as string));

    // Adicionar permissões a cada usuário
    const usersWithPermissions = await Promise.all(
      paginatedUsers.map(async (user) => {
        const permissions = await getUserPermissions(user.id, user.nivel_acesso, user.email);
        return {
          ...user,
          permissions
        };
      })
    );

    sendPaginated(res, usersWithPermissions, page, limit, totalUsers, 'Usuários com permissões');
  } catch (error) {
    console.error('Erro ao obter usuários com permissões:', error);
    sendError(res, 'Erro ao obter usuários', 500);
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    // Estatísticas gerais do sistema
    const users = await findAllUsers() as any[];
    const { orders: allOrders } = await findAllOrders({ page: 1, limit: 1 });
    const { items: allItems } = await findAllItems({ page: 1, limit: 1 });

    const [ordersStats] = await pool.execute(
      `SELECT 
        COUNT(*) as total,
        SUM(total) as revenue,
        status_pagamento,
        COUNT(CASE WHEN status_pagamento = 'confirmado' THEN 1 END) as confirmados
      FROM pedidos GROUP BY status_pagamento`
    );

    const [userStats] = await pool.execute(
      `SELECT nivel_acesso, COUNT(*) as count FROM usuarios GROUP BY nivel_acesso`
    );

    sendSuccess(res, {
      totalUsers: users.length,
      usersByRole: (userStats as any[]).reduce((acc, stat) => {
        acc[stat.nivel_acesso] = stat.count;
        return acc;
      }, {}),
      orderStats: {
        total: allOrders?.length || 0,
        byStatus: (ordersStats as any[]).reduce((acc, stat) => {
          acc[stat.status_pagamento] = {
            count: stat.total,
            revenue: stat.revenue || 0
          };
          return acc;
        }, {})
      },
      lastUpdated: new Date().toISOString()
    }, 'Estatísticas do dashboard');
  } catch (error) {
    console.error('Erro ao obter estatísticas:', error);
    sendError(res, 'Erro ao obter estatísticas', 500);
  }
};
