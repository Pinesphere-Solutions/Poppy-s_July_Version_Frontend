import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',  // Allows external access
    allowedHosts: ['sewingfront.pinesphere.co.in'], // Add this line
    proxy: {
      '/api': {
        target: 'https://oceanatlantic.pinesphere.co.in/',  // Update API target if needed
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
