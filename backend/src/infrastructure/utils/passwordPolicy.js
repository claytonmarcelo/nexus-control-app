export const PASSWORD_POLICY_MESSAGE = 'Use de 5 a 6 dígitos seguidos de 1 símbolo (6 ou 7 caracteres).';

export const validatePassword = (password) => {
  if (typeof password !== 'string' || !/^\d{5,6}[^A-Za-z0-9\s]$/.test(password)) {
    return 'A senha deve conter de 5 a 6 dígitos seguidos de 1 símbolo (6 ou 7 caracteres)';
  }
  return true;
};
