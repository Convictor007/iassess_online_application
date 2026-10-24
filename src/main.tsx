import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import RevisionPage from './components/RevisionPage.tsx'

// /revision is the token-gated citizen upload page linked from needs-revision
// emails. It is intentionally not part of the public form flow and has no
// navigation to it — only people holding a signed link can use it.
const isRevisionRoute = window.location.pathname.replace(/\/+$/, '') === '/revision'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isRevisionRoute ? <RevisionPage /> : <App />}
  </StrictMode>,
)
