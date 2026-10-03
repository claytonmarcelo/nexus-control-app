import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { isTokenRevoked } from '../infrastructure/security/tokenBlacklist.js';

export const generateToken = (payload: Record<string, unknown>) => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, jwtid: randomUUID(), algorithm: 'HS256' }
  );
};

export const generateRefreshToken = (payload: Record<string, unknown>) => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN, jwtid: randomUUID(), algorithm: 'HS256' }
  );
};

export const generateTokens = (payload: Record<string, unknown>) => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded) return null;
    if ((decoded as any).jti && isTokenRevoked((decoded as any).jti)) return null;
    return decoded as JwtPayload;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token: string): JwtPayload | null => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded) return null;
    if ((decoded as any).jti && isTokenRevoked((decoded as any).jti)) return null;
    return decoded as JwtPayload;
  } catch {
    return null;
  }
};

export const decodeToken = (token: string) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};