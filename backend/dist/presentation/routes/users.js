import { Router } from 'express';
import { create, getAll, getById, update, remove, deleteOwnAccount, changePassword, getPermissions, updatePermissions, } from '../controllers/userController.js';
import { validateAdminUserCreate, validateUserUpdate, validateIdParam, validatePagination, validatePasswordChange, validateAccountDeletion, validatePermissions, } from '../middleware/validation.js';
import { authenticate, authorize, authorizePage } from '../middleware/auth.js';
import { USER_ROLES } from '../../infrastructure/User.js';
const router = Router();
router.use(authenticate);
router.delete('/me', validateAccountDeletion, deleteOwnAccount);
// Rotas de administração de usuários (apenas admin com permissão na página 'usuarios')
router.post('/', authorize(USER_ROLES.ADMIN), authorizePage('usuarios'), validateAdminUserCreate, create);
router.get('/', authorize(USER_ROLES.ADMIN), authorizePage('usuarios'), validatePagination, getAll);
router.get('/:id/permissions', authorize(USER_ROLES.ADMIN), authorizePage('usuarios'), validateIdParam, getPermissions);
router.put('/:id/permissions', authorize(USER_ROLES.ADMIN), authorizePage('usuarios'), validateIdParam, validatePermissions, updatePermissions);
router.delete('/:id', authorize(USER_ROLES.ADMIN), authorizePage('usuarios'), validateIdParam, remove);
// Rotas de perfil/usuário (permitidas para o próprio usuário autenticado ou admin)
router.get('/:id', validateIdParam, getById);
router.put('/:id', validateIdParam, validateUserUpdate, update);
router.put('/:id/password', validateIdParam, validatePasswordChange, changePassword);
export default router;
