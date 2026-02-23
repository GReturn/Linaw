import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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