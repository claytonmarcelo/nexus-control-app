import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';
import usersRoutes from './routes/users.js';
import ordersRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

dotenv.config();

// Validar FRONTEND_URL em produção
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

if (isProduction && !frontendUrl) {
  throw new Error(
    'FRONTEND_URL é obrigatório em produção. Configure a variável de ambiente FRONTEND_URL com a URL pública do frontend.'
  );
}

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const allowedOrigins = (frontendUrl || 'http://localhost:5173').split(',').map((origin) => origin.trim());

// Configurar helmet com CSP explícita para Google Fonts e recursos necessários
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedOrigins]
    }
  },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  noSniff: true,
  xssFilter: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: isProduction, preload: isProduction }
}));

app.use(compression());

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

// Health check routes - sem rate limit para AWS health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

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