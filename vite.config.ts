import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// GitHub Pages served under /IMMO-INC/. Vite base must match the repo name.
export default defineConfig({
  plugins: [react()],
  base: '/IMMO-INC/',
})
