export const PASSWORD_POLICY_MESSAGE = 'A senha deve ter pelo menos 12 caracteres, incluindo letras, números e símbolos.';

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length < 12) {
    return 'A senha deve ter pelo menos 12 caracteres';
  }
  if (password.length > 128) {
    return 'A senha deve ter no máximo 128 caracteres';
  }
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'A senha precisa conter letras, números e símbolos';
  }
  return true;
};