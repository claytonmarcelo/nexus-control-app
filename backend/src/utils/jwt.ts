import { JWT_SECRET, JWT_EXPIRES_IN, JWT_REFRESH_EXPIRES_IN } from '../config/jwt.js';
import jwt from 'jsonwebtoken';
import type { JwtPayload } from 'jsonwebtoken';

export const generateToken = (payload: Record<string, unknown>) => {
  return jwt.sign({ ...payload, type: 'access' }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

export const generateRefreshToken = (payload: Record<string, unknown>) => {
  return jwt.sign({ ...payload, type: 'refresh' }, JWT_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

export const verifyToken = (token: string): JwtPayload | null => {
  try {
  const decoded = jwt.verify(token, JWT_SECRET);
  return typeof decoded === 'string' ? null : decoded;
  } catch (error) {
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