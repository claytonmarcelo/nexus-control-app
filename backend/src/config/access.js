import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.ROOT_ADMIN_EMAIL) {
	throw new Error('ROOT_ADMIN_EMAIL é obrigatório em produção.');
}

export const ROOT_ADMIN_EMAIL = (process.env.ROOT_ADMIN_EMAIL || 'marcelo10@gmail.com').toLowerCase();
export const ROOT_ADMIN_NAME = process.env.ROOT_ADMIN_NAME || 'Marcelo';

export const isRootAdmin = (user) => user?.email?.toLowerCase() === ROOT_ADMIN_EMAIL;
