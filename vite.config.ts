import { defineConfig } from 'vite';
import { resolve } from 'path';
import dts from 'vite-plugin-dts';

// ES Module build for direct browser import via <script type="module">
export default defineConfig({
  plugins: [
    dts({
      outDir: 'dist',
      insertTypesEntry: true,
      rollupTypes: true
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      fileName: () => 'app.js',
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
