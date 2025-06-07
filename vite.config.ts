import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    host: '0.0.0.0', // Expose to all network interfaces
    port: 5173, // Default port, change if needed
    allowedHosts: ['miamipi.ddns.net', 'dev.zaboka.net', 'miamipi.zaboka.net'] // Allow access from these domains
  },
});