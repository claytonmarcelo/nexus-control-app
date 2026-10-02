export const ROOT_ADMIN_EMAIL = (import.meta.env.VITE_ROOT_ADMIN_EMAIL || 'marcelo10@gmail.com').toLowerCase();

export const isRootAdmin = (user) => user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
