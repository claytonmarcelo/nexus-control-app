export const PAGE_PERMISSIONS = {
  DASHBOARD: 'dashboard',
  ITENS: 'itens',
  USUARIOS: 'usuarios',
  PERFIL: 'perfil',
  CARRINHO: 'carrinho',
  CHECKOUT: 'checkout',
  ADMIN: 'admin',
};

export const PAGE_PERMISSION_KEYS = Object.values(PAGE_PERMISSIONS);

export const DEFAULT_PERMISSIONS = {
  admin: {
    dashboard: true,
    itens: true,
    usuarios: true,
    perfil: true,
    carrinho: true,
    checkout: true,
    admin: true,
  },
  funcionario: {
    dashboard: true,
    itens: true,
    usuarios: false,
    perfil: true,
    carrinho: true,
    checkout: true,
    admin: false,
  },
  cliente: {
    dashboard: true,
    itens: true,
    usuarios: false,
    perfil: true,
    carrinho: true,
    checkout: true,
    admin: false,
  },
};

export const getDefaultPermissions = (role) => ({
  ...(DEFAULT_PERMISSIONS[role] || DEFAULT_PERMISSIONS.cliente),
});
