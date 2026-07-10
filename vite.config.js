import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Content-Security-Policy: o navegador bloqueia qualquer conexão de saída
// (connect-src 'none') e qualquer script que não venha do próprio site.
// Mesmo que um código malicioso entrasse no bundle, não conseguiria enviar
// os dados do usuário para fora.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // Tailwind é 'self'; React/recharts usam style inline
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'none'",
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
  plugins: [react(), cspPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
