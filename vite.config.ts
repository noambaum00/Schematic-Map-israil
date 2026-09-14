import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const githubPagesBase = '/Schematic-Map-israil/'

export default defineConfig(({ mode }) => ({
  base: mode === 'production' ? githubPagesBase : '/',
  plugins: [react(), tailwindcss()],
}))
