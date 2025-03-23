import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  base: '/louder-tts/',
  build: {
    outDir: 'docs',
  },
  plugins: [
    tailwindcss(),
  ],
})