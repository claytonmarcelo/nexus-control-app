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
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};
