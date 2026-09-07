import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  update,
  remove,
  changePassword,
  getPermissions,
  updatePermissions,
} from '../controllers/userController.js';
import {
  validateAdminUserCreate,
  validateUserUpdate,
  validateIdParam,
  validatePagination,
  validatePasswordChange,
  validatePermissions,
} from '../middleware/validation.js';
import { authenticate, authorize, authorizePage } from '../middleware/auth.js';
import { USER_ROLES } from '../models/User.js';

const router = Router();

router.use(authenticate);
router.use(authorizePage('usuarios'));

router.post('/', validateAdminUserCreate, authorize(USER_ROLES.ADMIN), create);
router.get('/', validatePagination, authorize(USER_ROLES.ADMIN), getAll);
router.get('/:id/permissions', validateIdParam, authorize(USER_ROLES.ADMIN), getPermissions);
router.put('/:id/permissions', validateIdParam, validatePermissions, authorize(USER_ROLES.ADMIN), updatePermissions);
router.get('/:id', validateIdParam, getById);
router.put('/:id', validateIdParam, validateUserUpdate, update);
router.delete('/:id', validateIdParam, authorize(USER_ROLES.ADMIN), remove);
router.put('/:id/password', validateIdParam, validatePasswordChange, changePassword);

export default router;
