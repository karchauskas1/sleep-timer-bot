import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    // Report gzipped sizes for accurate bundle size tracking
    reportCompressedSize: true,
    // Warn if chunk exceeds 100KB gzipped
    chunkSizeWarningLimit: 100,
    rollupOptions: {
      output: {
        manualChunks: {
          'framer-motion': ['framer-motion'],
          'vendor': ['react', 'react-dom', 'zustand'],
          'date-fns': ['date-fns'],
          'dexie': ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
})
