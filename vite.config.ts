import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: true,
    port: 5173,
    headers: {
      // Allow Paddle domains to be loaded in iframes
      'Content-Security-Policy': "frame-src 'self' https://*.paddle.com https://*.paddlejs.com https://buy.paddle.com https://checkout.paddle.com https://js.paddle.com; frame-ancestors 'self'"
    }
  }
});