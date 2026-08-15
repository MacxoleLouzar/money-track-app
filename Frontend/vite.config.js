import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'MoneyTrack',
        short_name: 'MoneyTrack',
        description: 'Personal expense tracker',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/money-track-app/',
        start_url: '/money-track-app/',
        icons: [
          { src: '/money-track-app/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/money-track-app/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/money-track-app/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/money-track-app/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  base: mode === 'production' ? '/money-track-app/' : '/',
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
}))
