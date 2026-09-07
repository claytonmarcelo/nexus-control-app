import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPages,
  getUserPermissionsById,
  updateUserPermissions,
  getAllUsersWithPermissions,
  getDashboardStats
} from '../controllers/adminController.js';

const router = express.Router();

// Todas as rotas requerem autenticação e perfil admin
router.use(authenticate, authorize('admin'));

// Obter mapeamento de páginas, views e roles
router.get('/pages', getPages);

// Obter permissões de um usuário específico
router.get('/users/:userId/permissions', getUserPermissionsById);

// Atualizar permissões de um usuário
router.put('/users/:userId/permissions', updateUserPermissions);

// Listar todos os usuários com suas permissões
router.get('/users', getAllUsersWithPermissions);

// Obter estatísticas do dashboard
router.get('/stats', getDashboardStats);

export default router;
