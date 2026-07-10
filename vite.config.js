import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Content-Security-Policy: o navegador bloqueia qualquer conexão de saída
// que não seja para os serviços do Firebase (login e sincronização
// criptografada) e qualquer script que não venha do próprio site. Mesmo que
// um código malicioso entrasse no bundle, só conseguiria falar com o
// Firebase — onde os dados chegam criptografados de ponta a ponta.
//
//   identitytoolkit  → login/criação de conta (Firebase Auth)
//   securetoken      → renovação do token de sessão
//   firestore        → leitura/escrita do documento criptografado do usuário
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind é 'self'; React/recharts usam style inline
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self' https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
].join('; ')

// Injeta a CSP apenas no build de produção — o dev server precisa de
// websocket/fetch locais para o hot reload.
function cspPlugin() {
  return {
    name: 'inject-csp',
    apply: 'build',
    transformIndexHtml(html) {
      return {
        html,
        tags: [
          {
            tag: 'meta',
            attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
            injectTo: 'head-prepend',
          },
        ],
      }
    },
  }
}

export default defineConfig({
  // caminho do site no GitHub Pages: https://pexiss-18.github.io/px_financeiro/
  base: '/px_financeiro/',
  plugins: [
    react(),
    cspPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'PX Financeiro — Finanças Pessoais',
        short_name: 'PX Financeiro',
        description:
          'Controle de finanças pessoais: receitas, despesas, orçamento e metas. Dados no seu aparelho, com sincronização opcional criptografada de ponta a ponta.',
        lang: 'pt-BR',
        display: 'standalone',
        theme_color: '#0f172a',
        background_color: '#0f172a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png}'],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
