module.exports = {
  apps: [{
    name: 'nexus-backend',
    cwd: __dirname,
    script: 'dist/server.js',
    instances: 1,
    exec_mode: 'fork',
    autorestart: true,
    watch: false,
    max_memory_restart: '512M',
    min_uptime: '10s',
    max_restarts: 10,
    restart_delay: 5000,
    // `wait_ready` fica desligado de propósito: o backend NÃO emite
    // process.send('ready') — não existe nenhuma chamada em src/ — então ligá-lo
    // faria o PM2 esperar `listen_timeout` (15s) em todo reload antes de marcar
    // "online". A confirmação real de que a API e o banco estão prontos vem do
    // health check em /api/health no fim do deploy-aws.sh, que cobre essa lacuna.
    wait_ready: false,
    kill_timeout: 8000,
    listen_timeout: 15000,
    shutdown_with_message: false,
    // Logs estruturados para CloudWatch Agent / `pm2 logs`
    error_file: 'logs/error.log',
    out_file: 'logs/out.log',
    pid_file: 'logs/nexus-backend.pid',
    merge_logs: true,
    time: true,
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000,
    },
    env: {
      NODE_ENV: 'development',
      PORT: 3000,
    },
  }],
};
