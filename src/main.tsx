import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@xyflow/react/dist/style.css'
import './index.css'
import App from './App.tsx'
import faviconUrl from './assets/favicon.svg'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

const faviconLink = document.querySelector<HTMLLinkElement>("link[rel='icon']") ?? document.createElement('link')
faviconLink.rel = 'icon'
faviconLink.type = 'image/svg+xml'
faviconLink.href = faviconUrl
document.head.append(faviconLink)
