import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';

import apiRouter from './presentation/routes/index.js';
import { securitySanitizer } from './infrastructure/security/securityMiddleware.js';

import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const hasFrontendDist = fs.existsSync(frontendDist);

// Require explicit public origins in production; wildcard origins are unsafe.
const isProduction = process.env.NODE_ENV === 'production';
const frontendUrl = process.env.FRONTEND_URL;
const apiUrl = process.env.API_URL;

const parseOrigins = (value: string | undefined, variableName: string) => {
  if (!value) return [];
  return value.split(',').map((entry) => {
    const configuredOrigin = entry.trim();
    if (!configuredOrigin || configuredOrigin === '*') {
      throw new Error(`${variableName} deve conter origens explícitas, sem wildcard.`);
    }
    const parsedOrigin = new URL(configuredOrigin);
    if (!['http:', 'https:'].includes(parsedOrigin.protocol)) {
      throw new Error(`${variableName} deve conter URLs HTTP ou HTTPS.`);
    }
    return parsedOrigin.origin;
  });
};

if (isProduction && (!frontendUrl || !apiUrl)) {
  console.warn('⚠️ FRONTEND_URL e/ou API_URL não configurados. Habilitando compatibilidade para AWS Academy / Mesma Origem.');
}

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;
const allowedOrigins = parseOrigins(
  frontendUrl || 'http://localhost:5173,http://localhost:5174,http://localhost:5175',
  'FRONTEND_URL',
);
const allowedApiOrigins = parseOrigins(apiUrl || 'http://localhost:3000', 'API_URL');

const isAllowedOrigin = (origin: string): boolean => {
  if (allowedOrigins.includes(origin)) return true;
  try {
    const url = new URL(origin);
    const hostname = url.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '::1'].includes(hostname)) return true;
    if (hostname.endsWith('.amazonaws.com')) return true;
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(hostname)) return true;
  } catch {
    // ignore
  }
  return false;
};

// Configurar helmet com CSP explícita para Google Fonts e recursos necessários
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'", ...allowedApiOrigins]
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
    // Requisições sem origem (curl, server-to-server, mobile, mesma origem)
    if (!origin) return callback(null, true);
    return callback(null, isAllowedOrigin(origin));
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '1mb' }));
app.use(securitySanitizer);

// Rate limiters específicos
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10000,
  message: { error: 'Muitas requisições originadas deste IP, tente novamente mais tarde.' },
  skip: (req) => req.path === '/health' || req.path === '/api/health' || req.path === '/api/status'
});

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // 50 tentativas de login a cada 15 minutos
  message: { error: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
  skipSuccessfulRequests: true // Não conta requisições bem-sucedidas
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15, // Máximo 15 tentativas a cada 15 min para prevenir abuso e enumeração
  message: { error: 'Muitas solicitações de redefinição de senha. Tente novamente em 15 minutos.' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/forgot-password', passwordResetLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

// Health check routes - sem rate limit para AWS health checks
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', async (req, res) => {
  try {
    const pool = (await import('./config/database.js')).default;
    await pool.execute('SELECT 1');
    res.json({ status: 'ok', database: 'ok' });
  } catch {
    res.status(503).json({ status: 'unavailable', database: 'unavailable' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ success: true, message: 'Nexus Control API está rodando' });
});

// Servir arquivos estáticos do frontend caso a build exista
if (hasFrontendDist) {
  app.use(express.static(frontendDist));
}

// Rotas da API estruturadas com suporte a prefixo /api e fallback para proxies AWS/ALB
app.use('/api', apiRouter);
app.use('/', apiRouter);

// Fallback SPA para o frontend (qualquer rota que não seja /api serve o index.html)
if (hasFrontendDist) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

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
    if (isProduction || total === 0) {
      console.log(
        isProduction
          ? '🌱 Sincronizando o catálogo oficial de produtos e serviços...'
          : '🌱 Banco de dados sem itens cadastrados. Executando seed automático do catálogo...'
      );
      const { seedDatabase } = await import('./utils/seed.js');
      await seedDatabase();
      console.log('✅ Catálogo oficial sincronizado com sucesso no banco de dados!');
    }

  } catch (error: any) {
    if (isProduction) throw error;
    console.warn('⚠️ Inicialização do banco de dados:', error.message);
  }
};

/**
 * Varreduras periódicas das regras de negócio (§47/§61): vencimento de aluguéis
 * e avisos de inatividade comercial. Rodam uma vez após a migração e depois em
 * intervalo fixo — nunca por request do cliente.
 */
const MANUTENCAO_INTERVALO_MS = 6 * 60 * 60 * 1000;

const executarManutencao = async () => {
  try {
    const { marcarAlugueisVencidos } = await import('./infrastructure/Aluguel.js');
    const { marcarAvisosDeInatividade } = await import('./infrastructure/Conta.js');
    const vencidos = await marcarAlugueisVencidos();
    const inatividade = await marcarAvisosDeInatividade();
    if (vencidos.vencidos > 0 || inatividade.avisados > 0 || inatividade.reativados > 0) {
      console.log(`[Manutenção] ${vencidos.vencidos} aluguel(es) vencido(s); ${inatividade.avisados} aviso(s) de inatividade; ${inatividade.reativados} conta(s) reativada(s).`);
    }
  } catch (error: any) {
    console.warn('[Manutenção] Varredura não aplicada agora:', error.message);
  }
};

const iniciarManutencaoPeriodica = () => {
  executarManutencao();
  const timer = setInterval(executarManutencao, MANUTENCAO_INTERVALO_MS);
  if (typeof timer.unref === 'function') timer.unref();
};

if (process.env.NODE_ENV !== 'test') {
  const server = app.listen(PORT, () => {
    console.log(`Servidor Nexus Control rodando na porta ${PORT}`);
    initDatabase().then(() => {
      iniciarManutencaoPeriodica();
    }).catch((error) => {
      console.error('Falha ao inicializar o banco em produção:', error.message);
      server.close(() => process.exit(1));
    });
  });
}