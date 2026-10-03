import { afterAll, describe, expect, it } from '@jest/globals';
import request from 'supertest';
import app from '../server.js';
import pool from '../config/database.js';
import { generateTokens, verifyRefreshToken, verifyToken } from '../infrastructure/utils/jwt.js';
import { validatePassword } from '../infrastructure/utils/passwordPolicy.js';
describe('Security and readiness checks', () => {
    afterAll(async () => {
        await pool.end();
    });
    it('uses separate signing keys for access and refresh tokens', () => {
        const { accessToken, refreshToken } = generateTokens({ id: 123 });
        expect(verifyToken(accessToken)?.type).toBe('access');
        expect(verifyRefreshToken(refreshToken)?.type).toBe('refresh');
        expect(verifyToken(refreshToken)).toBeNull();
        expect(verifyRefreshToken(accessToken)).toBeNull();
    });
    it('accepts exactly six digits followed by one symbol as the global password policy', () => {
        expect(validatePassword('123456#')).toBe(true);
        expect(validatePassword('1234567')).not.toBe(true);
        expect(validatePassword('12345#')).not.toBe(true);
        expect(validatePassword('123456##')).not.toBe(true);
        expect(validatePassword('12345a#')).not.toBe(true);
        expect(validatePassword('Abcde1!x')).not.toBe(true);
    });
    it('rejects invalid new passwords at registration and recovery endpoints', async () => {
        const weakPassword = 'Abcde1!x';
        const registration = await request(app)
            .post('/api/auth/register')
            .send({ nome: 'Test User', email: 'password-policy@example.test', senha: weakPassword });
        const recovery = await request(app)
            .post('/api/auth/reset-password')
            .send({ token: 'test-token', senha: weakPassword });
        expect(registration.status).toBe(400);
        expect(registration.body.errors[0].msg).toMatch(/6 dígitos seguidos de 1 símbolo/);
        expect(recovery.status).toBe(400);
        expect(recovery.body.errors[0].msg).toMatch(/6 dígitos seguidos de 1 símbolo/);
    });
    it('does not grant CORS access to an unlisted origin', async () => {
        const response = await request(app)
            .get('/api/status')
            .set('Origin', 'https://untrusted.example');
        expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });
    it('grants CORS access to the local frontend origin', async () => {
        const response = await request(app)
            .get('/api/status')
            .set('Origin', 'http://localhost:5173');
        expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });
    it('exposes the AWS readiness route', async () => {
        const response = await request(app).get('/api/health');
        expect([200, 503]).toContain(response.status);
        expect(response.body).toHaveProperty('database');
    });
});
