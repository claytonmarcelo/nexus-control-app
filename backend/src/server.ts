import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import authRoutes from './presentation/routes/auth.js';
import itemsRoutes from './presentation/routes/items.js';
import usersRoutes from './presentation/routes/users.js';
import ordersRoutes from './presentation/routes/orders.js';
import adminRoutes from './presentation/routes/admin.js';
import curriculoRoutes from './presentation/routes/curriculo.js';

dotenv.config();

// Validar FRONTEND_URL em produção (com fallback para AWS Academy)
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;

if (isProduction && !frontendUrl) {
  console.warn(
    '⚠️ FRONTEND_URL não configurado explicitamente. Habilitando origens dinâmicas para AWS Academy.'
  );
}

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const allowedOrigins = (frontendUrl || 'http://localhost:5173,http://localhost:5174,http://localhost:5175').split(',').map((origin) => origin.trim());

// Configurar helmet com CSP explícita para Google Fonts e recursos necessários
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", '*', ...allowedOrigins]
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
    // Requisições sem origem (curl, server-to-server, mobile)
    if (!origin) return callback(null, true);
    
    // Se permitir qualquer ou origens listadas
    if (frontendUrl === '*' || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    
    // Permitir origens de redes locais e domínios da AWS EC2 / Academy
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      origin.includes('.compute.amazonaws.com') ||
      origin.includes('.amazonaws.com') ||
      /^http:\/\/\d+\.\d+\.\d+\.\d+(:\d+)?$/.test(origin)
    ) {
      return callback(null, true);
    }

    // Em produção na AWS, permitir para garantir funcionamento do frontend
    return callback(null, true);
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json());

// Rate limiters específicos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: 'Muitas requisições originadas deste IP, tente novamente mais tarde.' },
  skip: (req) => req.path === '/health' || req.path === '/api/status'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 tentativas de login a cada 15 minutos
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);

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
app.use('/api/curriculo', curriculoRoutes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Rota não encontrada' });
});

app.use((error, req, res, next) => {
  console.error('Erro não tratado:', error);
  res.status(500).json({ success: false, message: 'Erro interno do servidor' });
});

export default app;

const initDatabase = async () => {
  try {
    const { runMigrations } = await import('./utils/migrate.js');
    await runMigrations();

    const pool = (await import('./config/database.js')).default;
    const [rows]: any = await pool.execute('SELECT COUNT(*) as total FROM itens');
    const total = rows?.[0]?.total || 0;
    if (total === 0) {
      console.log('🌱 Banco de dados sem itens cadastrados. Executando seed automático do catálogo...');
      const { seedDatabase } = await import('./utils/seed.js');
      await seedDatabase();
      console.log('✅ Catálogo inicializado com sucesso no banco de dados!');
    }
  } catch (error: any) {
    console.warn('⚠️ Inicialização do banco de dados:', error.message);
  }
};

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, async () => {
    console.log(`Servidor Nexus Control rodando na porta ${PORT}`);
    await initDatabase();
  });
}