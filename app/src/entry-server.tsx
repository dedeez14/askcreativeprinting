import { StrictMode } from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppShell } from './App.tsx'

/**
 * Build-time render of one URL (scripts/prerender.mjs). Queries are left pending, exactly as on the
 * client's first render, so the markup is the built-in fallback content that hydration expects; the
 * live API data replaces it after load as before.
 */
export function render(url: string): string {
  const client = new QueryClient({ defaultOptions: { queries: { enabled: false } } })
  return renderToString(
    <StrictMode>
      <QueryClientProvider client={client}>
        <StaticRouter location={url}>
          <AppShell />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  )
}
