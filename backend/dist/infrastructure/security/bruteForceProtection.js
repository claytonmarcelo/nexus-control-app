/**
 * Proteção contra ataques de força bruta direcionados por conta/email.
 * Monitora tentativas consecutivas com falha e bloqueia temporariamente.
 */
const failedAttemptsByEmail = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_WINDOW_MS = 15 * 60 * 1000; // 15 minutos
// Limpeza periódica
setInterval(() => {
    const now = Date.now();
    for (const [email, record] of failedAttemptsByEmail.entries()) {
        if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
            failedAttemptsByEmail.delete(email);
        }
    }
}, 5 * 60 * 1000).unref();
export const isAccountLocked = (email) => {
    if (process.env.NODE_ENV === 'test')
        return false;
    if (!email || typeof email !== 'string')
        return false;
    const normalized = email.toLowerCase().trim();
    const record = failedAttemptsByEmail.get(normalized);
    if (!record)
        return false;
    const now = Date.now();
    if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
        failedAttemptsByEmail.delete(normalized);
        return false;
    }
    return record.count >= MAX_ATTEMPTS;
};
export const recordFailedLogin = (email) => {
    if (process.env.NODE_ENV === 'test')
        return;
    if (!email || typeof email !== 'string')
        return;
    const normalized = email.toLowerCase().trim();
    const now = Date.now();
    const record = failedAttemptsByEmail.get(normalized) || { count: 0, lastAttempt: now };
    if (now - record.lastAttempt > LOCKOUT_WINDOW_MS) {
        record.count = 1;
    }
    else {
        record.count += 1;
    }
    record.lastAttempt = now;
    failedAttemptsByEmail.set(normalized, record);
};
export const resetFailedLogins = (email) => {
    if (!email || typeof email !== 'string')
        return;
    const normalized = email.toLowerCase().trim();
    failedAttemptsByEmail.delete(normalized);
};
