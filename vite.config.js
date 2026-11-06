import { defineConfig } from 'vite';

export default defineConfig({
  // Electron opens dist/index.html through file://, so assets must be relative.
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    emptyOutDir: true
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true
  }
});
