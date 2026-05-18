import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3000,
        proxy: {
            '/api': { target: 'https://mobile-acceleration.onrender.com', changeOrigin: true },
            '/uploads': { target: 'https://mobile-acceleration.onrender.com', changeOrigin: true }
        }
    }
});
