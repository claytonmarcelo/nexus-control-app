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
    // O backend emite process.send('ready') quando HTTP está pronto; sem isso
    // PM2 assumia "online" antes do listen terminar e o reload derrubava
    // requisições em voo.
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
