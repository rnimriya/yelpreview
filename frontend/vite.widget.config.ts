import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    emptyOutDir: false, // Don't empty outDir so we don't delete the main SPA build
    lib: {
      entry: resolve(__dirname, 'src/embed.tsx'),
      name: 'TrustGuardWidget',
      formats: ['iife'],
      fileName: () => 'trustguard-widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.name?.endsWith('.css')) {
            return 'trustguard-widget.css';
          }
          return '[name][extname]';
        }
      }
    }
  }
})
