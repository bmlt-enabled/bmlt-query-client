/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [dts()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BmltQueryClient',
      fileName: (format) => `index.${format}.js`,
      formats: ['es', 'cjs']
    },
    rollupOptions: {
      external: ['axios', 'p-retry', 'p-queue'],
      output: {
        globals: {
          axios: 'axios',
          'p-retry': 'pRetry',
          'p-queue': 'PQueue'
        }
      }
    },
    sourcemap: true,
    target: 'es2020'
  },
  test: {
    environment: 'node',
    globals: true,
    timeout: 30000,
    setupFiles: ['./test/setup.ts']
  }
});
