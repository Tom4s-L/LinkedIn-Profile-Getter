import { defineConfig } from 'vite'
import packageJson from './package.json'
import { r } from './scripts/utils'

export default defineConfig({
  build: {
    outDir: r('extension/dist/background'),
    emptyOutDir: false,
    lib: {
      entry: r('src/background/main.ts'),
      name: packageJson.name,
      formats: ['iife'],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'index.mjs',
        extend: true,
      },
    },
  },
})
