import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

const ROOT_DIR = path.resolve(__dirname, 'client');

export default defineConfig({
  root: ROOT_DIR,
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true
  }
});
