import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

const BASE_PATH = '/main/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        manager: resolve(__dirname, 'manager.html')
      }
    }
  }
});
