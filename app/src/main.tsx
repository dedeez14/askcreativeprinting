import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClient } from './lib/queryClient'
import { initAnalytics } from './lib/analytics'
import './index.css'
import App from './App.tsx'

// Load GA4 + Meta Pixel (only if their env IDs are configured).
initAnalytics()

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>
)

// index.html carries the home page prerendered at build time (scripts/prerender.mjs), so "/" paints
// before any JavaScript runs and React only attaches to it. Every other URL is served app.html with an
// empty root; should a server still send the prerendered file for another path, it is rendered fresh.
const root = document.getElementById('root')!
if (root.hasAttribute('data-prerendered') && window.location.pathname === '/') {
  hydrateRoot(root, app)
} else {
  root.textContent = ''
  createRoot(root).render(app)
}

// Toasts only follow a form submit, so the toaster loads after the page and lives in its own root:
// the prerendered HTML has no toaster for hydration to match.
import('sonner').then(({ Toaster }) => {
  const host = document.body.appendChild(document.createElement('div'))
  createRoot(host).render(<Toaster position="top-right" richColors closeButton />)
})
