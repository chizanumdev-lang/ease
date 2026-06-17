module.exports = {
  apps: [
    {
      name: 'ease-api',
      script: 'dist/main.js',
      instances: 'max', // Or a specific number if you prefer
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
