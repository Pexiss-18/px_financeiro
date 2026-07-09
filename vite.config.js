import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // caminho do site no GitHub Pages: https://pexiss-18.github.io/px_financeiro/
  base: '/px_financeiro/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
