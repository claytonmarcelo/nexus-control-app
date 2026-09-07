export const PASSWORD_POLICY_MESSAGE = 'Use exatamente 6 caracteres: dígitos e um caractere especial. Não use datas de aniversário ou comemorativas.';

export function validatePassword(password) {
  if (!password) return 'Senha é obrigatória';
  if (password.length !== 6) return 'A senha deve ter exatamente 6 caracteres';
  if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'A senha precisa conter dígitos e um caractere especial';
  }
  if (/(19|20)\d{2}/.test(password) || /(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])/.test(password) || /(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])/.test(password)) {
    return 'Não use datas de aniversário ou comemorativas na senha';
  }
  return '';
}
