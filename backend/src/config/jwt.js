import dotenv from 'dotenv';

dotenv.config();

export const JWT_SECRET = process.env.JWT_SECRET || 'nexus-control-secret-key-2026';
export const JWT_EXPIRES_IN = '24h';
export const JWT_REFRESH_EXPIRES_IN = '7d';