export const ROOT_ADMIN_EMAIL = 'marcelo10@gmail.com';

export const isRootAdmin = (user) => user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
