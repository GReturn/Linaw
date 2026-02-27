import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      input: {
        // Just use the relative paths directly
        main: 'index.html', 
        sidepanel: 'sidepanel.html', 
      },
    },
  },
})