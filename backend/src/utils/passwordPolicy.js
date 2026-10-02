export const PASSWORD_POLICY_MESSAGE = 'Use exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres).';

export const validatePassword = (password) => {
  if (typeof password !== 'string' || !/^\d{6}[^A-Za-z0-9\s]$/.test(password)) {
    return 'A senha deve conter exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres)';
  }
  return true;
};
