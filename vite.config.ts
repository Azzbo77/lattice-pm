import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  // Serve from root — sw.js and manifest.json resolve correctly at /sw.js
  base: '/',

  server: {
    port: 3000,
  },

  build: {
    outDir: 'dist',
  },

  // bcryptjs runs in the browser (no Node APIs used at runtime).
  // This tells Vite's bundler not to treat it as a server-only module.
  ssr: {
    noExternal: ['bcryptjs'],
  },
})
