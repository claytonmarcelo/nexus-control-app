import { Router } from 'express';
import authRoutes from './auth.js';
import itemsRoutes from './items.js';
import usersRoutes from './users.js';
import ordersRoutes from './orders.js';
import adminRoutes from './admin.js';
import paymentsRoutes from './payments.js';
import alugueisRoutes from './alugueis.js';

const apiRouter = Router();

apiRouter.use('/auth', authRoutes);
apiRouter.use('/itens', itemsRoutes);
apiRouter.use('/usuarios', usersRoutes);
apiRouter.use('/pedidos', ordersRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/pagamentos', paymentsRoutes);
apiRouter.use('/alugueis', alugueisRoutes);

export { authRoutes, itemsRoutes, usersRoutes, ordersRoutes, adminRoutes, paymentsRoutes, alugueisRoutes };
export default apiRouter;
