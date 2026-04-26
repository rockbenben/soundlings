import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  // gh-pages serves at https://<user>.github.io/soundlings/ — relative base keeps it portable
  base: mode === 'production' ? './' : '/',
  plugins: [react()],
  build: {
    target: 'es2022',
    sourcemap: false,
    // Split antd into its own vendor chunk so app-only code changes don't
    // bust the user's cached antd bundle. antd is by far the biggest
    // dependency (~190 KB gz) and rarely changes between releases.
    // (We don't separately split react/react-dom — antd already pulls them
    // in as peer deps, so adding a third "react" chunk emits an empty file.)
    rollupOptions: {
      output: {
        manualChunks: {
          antd: ['antd'],
        },
      },
    },
    // The vendor chunk is intentionally large (~600 KB raw, ~190 KB gzip
    // for antd alone). Bumping the warning ceiling keeps the build log clean.
    chunkSizeWarningLimit: 700,
  },
  server: {
    port: 5173,
  },
}));
