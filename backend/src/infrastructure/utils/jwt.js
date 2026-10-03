import { JWT_SECRET, JWT_REFRESH_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import { randomUUID } from 'node:crypto';
import { isTokenRevoked } from '../security/tokenBlacklist.js';

export const generateToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'access' },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN, jwtid: randomUUID(), algorithm: 'HS256' }
  );
};

export const generateRefreshToken = (payload) => {
  return jwt.sign(
    { ...payload, type: 'refresh' },
    JWT_REFRESH_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN, jwtid: randomUUID(), algorithm: 'HS256' }
  );
};

export const generateTokens = (payload) => {
  return {
    accessToken: generateToken(payload),
    refreshToken: generateRefreshToken(payload)
  };
};

export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded) return null;
    if (decoded.jti && isTokenRevoked(decoded.jti)) return null;
    return decoded;
  } catch (error) {
    return null;
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_REFRESH_SECRET, { algorithms: ['HS256'] });
    if (typeof decoded === 'string' || !decoded) return null;
    if (decoded.jti && isTokenRevoked(decoded.jti)) return null;
    return decoded;
  } catch {
    return null;
  }
};

export const decodeToken = (token) => {
  try {
    return jwt.decode(token);
  } catch (error) {
    return null;
  }
};