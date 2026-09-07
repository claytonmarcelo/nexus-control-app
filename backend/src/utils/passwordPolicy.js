export const PASSWORD_POLICY_MESSAGE = 'A senha deve ter exatamente 6 caracteres, com dígitos e um caractere especial. Não use datas de aniversário ou comemorativas.';

export const validatePassword = (password) => {
  if (typeof password !== 'string' || password.length !== 6) {
    return 'A senha deve ter exatamente 6 caracteres';
  }
  if (!/\d/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
    return 'A senha precisa conter dígitos e um caractere especial';
  }
  if (/(19|20)\d{2}/.test(password) || /(?:0[1-9]|[12]\d|3[01])(?:0[1-9]|1[0-2])/.test(password) || /(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])/.test(password)) {
    return 'Não use datas de aniversário ou comemorativas na senha';
  }
  return true;
};
