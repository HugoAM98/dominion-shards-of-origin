import { defineConfig } from 'vite';

const repoBase = '/dominion-shards-of-origin/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS === 'true' ? repoBase : './',
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 1600,
  },
  server: {
    host: true,
    port: 5173,
  },
});
