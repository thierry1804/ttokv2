import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://vps-7841b0bb.vps.ovh.ca:3001',
        changeOrigin: true,
      },
    },
  },
})

