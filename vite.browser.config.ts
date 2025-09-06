import { defineConfig } from 'vite';
import { resolve } from 'path';

// Browser-specific build that includes all dependencies
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'BmltQueryClient',
      fileName: () => 'index.browser.js',
      formats: ['iife']
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      // Don't externalize any dependencies for browser build
      external: []
    }
  }
});
