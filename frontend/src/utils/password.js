export const PASSWORD_POLICY_MESSAGE = 'Use exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres).';

export function validatePassword(password) {
  if (!password) return 'Senha é obrigatória';
  if (!/^\d{6}[^A-Za-z0-9\s]$/.test(password)) {
    return 'A senha deve conter exatamente 6 dígitos seguidos de 1 símbolo (7 caracteres)';
  }
  return '';
}
