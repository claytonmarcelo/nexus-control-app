import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  getMyItems,
  update,
  remove,
} from '../controllers/itemController.js';
import { validateItem, validateIdParam, validatePagination } from '../middleware/validation.js';
import { authenticate, authorize, authorizePage } from '../middleware/auth.js';
import { USER_ROLES } from '../../domain/entities/User.js';

const router = Router();

router.use(authenticate);
router.use(authorizePage('itens'));

router.post('/', validateItem, authorize(USER_ROLES.ADMIN, USER_ROLES.FUNCIONARIO), create);
router.get('/', validatePagination, getAll);
router.get('/my-items', getMyItems);
router.get('/:id', validateIdParam, getById);
router.put('/:id', validateIdParam, validateItem, update);
router.delete('/:id', validateIdParam, authorize(USER_ROLES.ADMIN, USER_ROLES.FUNCIONARIO), remove);

export default router;