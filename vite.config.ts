import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Memory updates are application data, not source changes. Ignoring this
  // file prevents Vite's development watcher from reloading the page mid-reply.
  server: {
    watch: {
      ignored: ["**/memory_store.json"],
    },
  },
})
