import dotenv from 'dotenv';

dotenv.config();

// Validar JWT_SECRET em produção
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;

if (isProduction && !jwtSecret) {
  throw new Error(
    'JWT_SECRET é obrigatório em produção. Configure a variável de ambiente JWT_SECRET.'
  );
}

export const JWT_SECRET = jwtSecret || 'nexus-control-secret-key-2026';
export const JWT_EXPIRES_IN = '24h';
export const JWT_REFRESH_EXPIRES_IN = '7d';