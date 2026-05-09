/// <reference types="vitest/config" />

import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'unplugin-dts/vite';

// ES Module build for direct browser import via <script type="module">
export default defineConfig({
  plugins: [
    dts({
      outDirs: 'dist',
      insertTypesEntry: true,
      bundleTypes: true,
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'app.js',
      formats: ['es'],
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rolldownOptions: {
      // Don't externalize any dependencies - bundle everything for browser use
      external: [],
    },
  },
});
