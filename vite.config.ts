import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/weather-proxy': {
        target: 'https://api.weather-ai.co',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/weather-proxy/, ''),
        secure: true,
      },
    },
  },
});
