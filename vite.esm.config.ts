import { defineConfig } from 'vite';
import { resolve } from 'path';

// ES Module build for direct browser import via <script type="module">
export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'index.esm.js',
      formats: ['es']
    },
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
    rollupOptions: {
      // Don't externalize any dependencies - bundle everything for browser use
      external: []
    }
  }
});
