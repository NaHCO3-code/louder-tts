import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
export default defineConfig({
  base: '/continuation-writing-helper/',
  build: {
    outDir: 'docs',
  },
  plugins: [
    tailwindcss(),
  ],
})