import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    // ✅ IMPORTANT : l'app est servie sous /incident/
    base: '/incident/',

    server: {
      port: 3000,
      host: '0.0.0.0',

      // ✅ pour que le dev soit identique à la prod
      proxy: {
        '/api/incident': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          rewrite: (path) =>
            path.replace(/^\/api\/incident/, '/api/v1'),
        },
      },
    },

    plugins: [react()],

    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },

    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});