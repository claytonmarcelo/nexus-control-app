/**
 * Token Blacklist para revogação segura de sessões (Logout / Revogação).
 * Armazena identificadores únicos (jti) de tokens invalidados até a sua expiração natural.
 */
const revokedTokens = new Map();
// Limpeza periódica de tokens expirados da memória (a cada 10 minutos)
setInterval(() => {
    const now = Date.now();
    for (const [jti, expTime] of revokedTokens.entries()) {
        if (expTime <= now) {
            revokedTokens.delete(jti);
        }
    }
}, 10 * 60 * 1000).unref();
export const revokeToken = (jti, expSeconds) => {
    if (!jti)
        return;
    // expSeconds é timestamp Unix em segundos do JWT
    const expTime = expSeconds ? expSeconds * 1000 : Date.now() + 24 * 60 * 60 * 1000;
    revokedTokens.set(jti, expTime);
};
export const isTokenRevoked = (jti) => {
    if (!jti)
        return false;
    const expTime = revokedTokens.get(jti);
    if (!expTime)
        return false;
    if (expTime <= Date.now()) {
        revokedTokens.delete(jti);
        return false;
    }
    return true;
};
