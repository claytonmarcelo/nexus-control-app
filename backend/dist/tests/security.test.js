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
    it('rejects passwords below the production strength policy', () => {
        expect(validatePassword('abc123!')).not.toBe(true);
        expect(validatePassword('LongEnoughPassword123!')).toBe(true);
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
