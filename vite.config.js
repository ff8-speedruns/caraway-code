import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Two pages: the calculator and the pole-counting practice drill.
// Served as a GitHub Pages project site at ff8-speedruns.github.io/caraway-code/
export default defineConfig({
  base: '/caraway-code/',
  plugins: [react()],
  // The shared UI package is installed from git (and symlinked during local
  // development), so these can resolve from inside it as well as from here.
  // Two copies of React breaks every hook, and two copies of Mantine means the
  // provider's context is invisible to this app's components. Force one each.
  resolve: {
    dedupe: [
      'react',
      'react-dom',
      '@mantine/core',
      '@mantine/hooks',
      '@mantine/dropzone',
      '@tabler/icons-react',
    ],
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        practice: resolve(import.meta.dirname, 'practice/index.html'),
      },
    },
  },
});
