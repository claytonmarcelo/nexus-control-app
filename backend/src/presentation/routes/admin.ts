import express from 'express';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  getPages,
  getUserPermissionsById,
  getPermissionsHandler,
  updateUserPermissions,
  getAllUsersWithPermissions,
  getDashboardStats,
  seedCatalog
} from '../controllers/adminController.js';

const router = express.Router();

// Todas as rotas requerem autenticação e perfil admin
router.use(authenticate, authorize('admin'));

// Obter mapeamento de páginas, views e roles
router.get('/pages', getPages);

// Obter permissões (suporte a /permissions, /permissions/:userId, /users/:userId/permissions)
router.get('/permissions', getPermissionsHandler);
router.get('/permissions/:userId', getUserPermissionsById);
router.get('/users/:userId/permissions', getUserPermissionsById);
router.get('/users/permissions', getPermissionsHandler);

// Atualizar permissões (PUT e POST para todas as variantes)
router.put('/permissions', updateUserPermissions);
router.put('/permissions/:userId', updateUserPermissions);
router.put('/users/:userId/permissions', updateUserPermissions);
router.put('/users/permissions', updateUserPermissions);

router.post('/permissions', updateUserPermissions);
router.post('/permissions/:userId', updateUserPermissions);
router.post('/users/:userId/permissions', updateUserPermissions);
router.post('/users/permissions', updateUserPermissions);

// Listar todos os usuários com suas permissões
router.get('/users', getAllUsersWithPermissions);

// Obter estatísticas do dashboard
router.get('/stats', getDashboardStats);

// Semear / restaurar catálogo de produtos
router.post('/seed', seedCatalog);

export default router;
