import dotenv from 'dotenv';
dotenv.config();
const isProduction = process.env.NODE_ENV === 'production';
const jwtSecret = process.env.JWT_SECRET;
const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;
if (isProduction) {
    const secrets = [
        ['JWT_SECRET', jwtSecret],
        ['JWT_REFRESH_SECRET', jwtRefreshSecret],
    ];
    const invalidSecret = secrets.find(([, secret]) => !secret || secret.length < 32);
    if (invalidSecret) {
        throw new Error(`${invalidSecret[0]} deve ser configurado com pelo menos 32 caracteres em produção.`);
    }
    if (jwtSecret === jwtRefreshSecret) {
        throw new Error('JWT_SECRET e JWT_REFRESH_SECRET devem ser diferentes.');
    }
    if ([jwtSecret, jwtRefreshSecret].some((secret) => /^(replace_with_|your_|change_in_production|test_|sua_|gere_)/i.test(secret))) {
        throw new Error('JWT_SECRET e JWT_REFRESH_SECRET não podem usar valores de exemplo.');
    }
}
export const JWT_SECRET = jwtSecret || 'development-access-secret-change-me';
export const JWT_REFRESH_SECRET = jwtRefreshSecret || 'development-refresh-secret-change-me';
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
export const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
