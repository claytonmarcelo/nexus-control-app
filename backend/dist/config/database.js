import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();
if (process.env.NODE_ENV === 'production') {
    const missingDatabaseConfig = ['DB_HOST', 'DB_USER', 'DB_NAME'].filter((key) => !process.env[key]);
    if (!process.env.DB_PASS && !process.env.DB_PASSWORD)
        missingDatabaseConfig.push('DB_PASS');
    if (missingDatabaseConfig.length > 0) {
        throw new Error(`Configuração de banco obrigatória em produção: ${missingDatabaseConfig.join(', ')}.`);
    }
}
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nexusdb',
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 5),
    queueLimit: 0,
    charset: 'utf8mb4',
    connectTimeout: 5000,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
    ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } } : {})
});
export const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Conexão com MySQL estabelecida com sucesso');
        connection.release();
        return true;
    }
    catch (error) {
        console.error('❌ Erro ao conectar ao MySQL:', error.message);
        return false;
    }
};
export default pool;
