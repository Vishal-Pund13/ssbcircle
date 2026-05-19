import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    // Raise warning threshold — LiveKit is inherently large
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          // LiveKit — huge, only needed inside a room
          if (id.includes('livekit-client') || id.includes('@livekit')) {
            return 'livekit';
          }
          // Framer Motion — only needed for SwipeReader + LandingPage
          if (id.includes('framer-motion')) {
            return 'framer-motion';
          }
          // Maps — only loaded when HeroMapAnimation / IndiaImpactMap renders
          if (
            id.includes('react-simple-maps') ||
            id.includes('node_modules/d3-') ||
            id.includes('topojson')
          ) {
            return 'maps';
          }
          // Core React vendor — always needed, cache-stable
          if (
            id.includes('node_modules/react/') ||
            id.includes('node_modules/react-dom/') ||
            id.includes('node_modules/react-router-dom/')
          ) {
            return 'react-vendor';
          }
          // Lucide icons — tree-shaken but still sizeable
          if (id.includes('lucide-react')) {
            return 'icons';
          }
        },
      },
    },
  },
});
