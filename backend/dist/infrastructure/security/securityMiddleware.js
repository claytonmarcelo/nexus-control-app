import { sendError } from '../utils/response.js';
/**
 * Sanitiza recursivamente valores de strings contra XSS e injeção de caracteres perigosos.
 */
const sanitizeValue = (value) => {
    if (typeof value === 'string') {
        return value
            .replace(/\0/g, '') // Remove null bytes
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove tags script
            .replace(/javascript\s*:/gi, '') // Remove pseudo-protocolo javascript
            .replace(/on\w+\s*=/gi, ''); // Remove event handlers como onload=, onerror=
    }
    return value;
};
/**
 * Inspeciona recursivamente objetos para detectar e bloquear prototype pollution e NoSQL injection.
 */
const inspectAndSanitize = (obj, depth = 0) => {
    if (depth > 10 || !obj || typeof obj !== 'object') {
        return;
    }
    if (Object.prototype.hasOwnProperty.call(obj, '__proto__')) {
        throw new Error('Protótipo malicioso detectado');
    }
    for (const key of Object.getOwnPropertyNames(obj)) {
        // Bloqueia poluição de protótipo
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            throw new Error('Protótipo malicioso detectado');
        }
        // Bloqueia operadores NoSQL / MongoDB como $gt, $where, $ne
        if (key.startsWith('$')) {
            throw new Error('Operador de injeção não permitido detectado');
        }
        const val = obj[key];
        if (typeof val === 'string') {
            obj[key] = sanitizeValue(val);
        }
        else if (typeof val === 'object' && val !== null) {
            inspectAndSanitize(val, depth + 1);
        }
    }
};
/**
 * Middleware global de proteção contra injeções, XSS e poluição de protótipo.
 */
export const securitySanitizer = (req, res, next) => {
    try {
        if (req.body && typeof req.body === 'object') {
            inspectAndSanitize(req.body);
        }
        if (req.query && typeof req.query === 'object') {
            inspectAndSanitize(req.query);
        }
        if (req.params && typeof req.params === 'object') {
            inspectAndSanitize(req.params);
        }
        // Headers adicionais de defesa em profundidade contra roubo de sessão e vazamento
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('X-XSS-Protection', '1; mode=block');
        res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
        next();
    }
    catch (error) {
        return sendError(res, error.message || 'Payload inválido ou potencialmente inseguro', 400);
    }
};
