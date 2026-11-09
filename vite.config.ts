import { defineConfig } from 'vite';

const pagesBase = '/dominion-shards-of-origin/';

export default defineConfig(({ mode }) => ({
  base: mode === 'pages' ? pagesBase : './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true,
    port: 5173,
  },
}));
