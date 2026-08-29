import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // 서비스 워커 및 소스 변경 시 자동 업데이트
      devOptions: {
        enabled: false, // 💡 개발 모드(npm run dev)에서 Service Worker를 비활성화하여 SW 캐시 에러 방지
      },
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'SpoOdds App',
        short_name: 'SpoOdds',
        description: 'SpoOdds Community & Odds App',
        theme_color: '#0D1B2A',
        background_color: '#070e17',
        display: 'standalone', // 브라우저 주소창 제거 (독립 앱 형태로 실행)
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // 안드로이드 어댑티브 아이콘 대응
          }
        ]
      }
    })
  ],
  server: {
    port: 3000,
    host: '0.0.0.0',
    strictPort: true,
    // 💡 개발 환경 CORS 방지용 프록시(Proxy) 설정
    proxy: {
      '/api': {
        target: 'https://dou-api.wildwynn.com',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  preview: {
    port: 3000,
    host: '0.0.0.0'
  }
});