module.exports = {
  apps: [
    {
      name: 'api-gateway',
      script: './src/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        PORT: 5000,
        NODE_ENV: 'development',
      },
      env_production: {
        PORT: 5000,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'transcoding-service',
      script: './services/transcoding/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        PORT: 5001,
        NODE_ENV: 'development',
      },
      env_production: {
        PORT: 5001,
        NODE_ENV: 'production',
      },
    },
    {
      name: 'notification-service',
      script: './services/notification/server.js',
      cwd: './',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        PORT: 5002,
        NODE_ENV: 'development',
      },
      env_production: {
        PORT: 5002,
        NODE_ENV: 'production',
      },
    },
  ],
};
