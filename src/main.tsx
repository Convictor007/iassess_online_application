import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RevisionPage from './components/RevisionPage.tsx'

// The token-gated revision page is intentionally absent from the public form flow.
const revisionRoutes = ['/uploadrevision', '/revision']
const isRevisionRoute = revisionRoutes.includes(window.location.pathname.replace(/\/+$/, ''))

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRevisionRoute ? <RevisionPage /> : <App />}
  </StrictMode>,
)
