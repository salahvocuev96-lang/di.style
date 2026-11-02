import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App'
import { seedIfEmpty } from './data/seed'
import { db } from './data/db'

registerSW({ immediate: true })

// Просим браузер не удалять данные при нехватке места (особенно важно для iOS/Safari).
if (navigator.storage?.persist) navigator.storage.persist().catch(() => {})

const root = createRoot(document.getElementById('root')!)

seedIfEmpty()
  .catch((e) => console.error('seed failed', e))
  .finally(() => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    )
  })

// Для отладки в консоли браузера
;(window as unknown as { lifeDb: typeof db }).lifeDb = db
