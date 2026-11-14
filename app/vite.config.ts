import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  // The inspector tags every JSX element with code-path="file:line" for the dev overlay; in a production
  // build that was ~1,200 attributes of dead weight in the bundle and the DOM.
  plugins: [{ ...inspectAttr(), apply: 'serve' as const }, react()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
