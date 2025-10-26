import { dirname, relative } from 'node:path'
import vue from '@vitejs/plugin-vue'
import UnoCSS from 'unocss/vite'
import { defineConfig } from 'vite'
import { r } from './scripts/utils'

export default defineConfig({
  root: r('src'),
  resolve: {
    alias: {
      '~/': `${r('src')}/`,
    },
  },
  plugins: [
    vue(),
    UnoCSS(),
    {
      name: 'assets-rewrite',
      enforce: 'post',
      apply: 'build',
      transformIndexHtml(html, { path }) {
        return html.replace(/"\/assets\//g, `"${relative(dirname(path), '/assets')}/`)
      },
    },
  ],
  build: {
    outDir: r('extension/dist'),
    emptyOutDir: false,
    assetsDir: 'assets',
    rollupOptions: {
      input: {
        app: r('src/app/index.html'),
      },
    },
  },
})
