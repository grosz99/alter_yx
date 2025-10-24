import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: '0.0.0.0', // Listen on all interfaces
    // Security: Configure CORS properly
    cors: {
      origin: ['http://localhost:8000'],
      credentials: true
    }
  },
  build: {
    // Security: Generate source maps for debugging but not in production
    sourcemap: false,
    // Security: Minimize bundle size
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    }
  },
  // Security: Configure CSP
  define: {
    __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production')
  }
})