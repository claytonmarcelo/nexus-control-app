import dotenv from 'dotenv';

dotenv.config();

export const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'marcelo10@gmail.com').toLowerCase();
export const ROOT_ADMIN_NAME = process.env.ROOT_ADMIN_NAME || 'Marcelo';

export const isRootAdmin = (user) => user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
