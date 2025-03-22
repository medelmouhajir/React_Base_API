import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './sw-register'

// Register the service worker for PWA functionality
registerServiceWorker();

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)