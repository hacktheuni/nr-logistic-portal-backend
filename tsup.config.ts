import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/server.ts'],
  format: ['esm'],
  splitting: false,
  sourcemap: true,
  clean: true,
  dts: false,
  minify: true,
  target: 'es2022'
})
