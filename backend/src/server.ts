import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import usersRoutes from './routes/users.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map((origin) => origin.trim());

app.use(helmet());

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error('Origem não autorizada'));
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: 'Muitas requisições originadas deste IP, tente novamente mais tarde.' }
});
app.use('/api/', limiter);

app.get('/api/status', (req, res) => {
  res.json({ success: true, message: 'Nexus Control API está rodando' });
});

app.use('/api/auth', authRoutes);
app.use('/api/itens', itemsRoutes);
app.use('/api/usuarios', usersRoutes);
app.use('/api/pedidos', ordersRoutes);
app.use('/api/admin', adminRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

export default app;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`Servidor Nexus Control rodando na porta ${PORT}`);
  });
}