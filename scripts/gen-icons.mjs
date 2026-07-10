// Gera os ícones PNG do PWA a partir de public/icon.svg
// Uso: node scripts/gen-icons.mjs
import sharp from 'sharp'
import { readFileSync } from 'fs'

const svg = readFileSync('public/icon.svg')
const svgText = readFileSync('public/icon.svg', 'utf8')

// maskable: fundo cobre o canvas inteiro (o launcher aplica a máscara)
// e o desenho fica na zona segura de 80%
const maskableSvg = svgText
  .replace('rx="115"', 'rx="0"')
  .replace('translate(88 88) scale(14)', 'translate(130 130) scale(10.5)')

// apple-touch-icon: iOS não aceita transparência; fundo sólido sem cantos
const appleSvg = svgText.replace('rx="115"', 'rx="0"')

await sharp(svg).resize(192, 192).png().toFile('public/pwa-192x192.png')
await sharp(svg).resize(512, 512).png().toFile('public/pwa-512x512.png')
await sharp(Buffer.from(maskableSvg)).resize(512, 512).png().toFile('public/pwa-maskable-512x512.png')
await sharp(Buffer.from(appleSvg)).resize(180, 180).png().toFile('public/apple-touch-icon.png')
console.log('ícones gerados em public/')
