import { defineConfig } from 'vite'

// GitHub Pages はリポジトリ名のサブパスで配信されるため、相対パスで出力する
export default defineConfig({
  base: './',
})
