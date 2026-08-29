import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// IMPORTANT: this must match your GitHub repo name, because GitHub Pages
// serves a project site at https://<username>.github.io/<repo-name>/ —
// your repo is named "BZ", so the site lives under /BZ/. If you ever
// rename the repo, update this to match (e.g. '/new-repo-name/').
const BASE_PATH = '/BZ/';

export default defineConfig({
  base: BASE_PATH,
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        manager: resolve(__dirname, 'manager.html'),
        view: resolve(__dirname, 'view.html')
      }
    }
  }
});
