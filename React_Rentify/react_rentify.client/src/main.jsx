// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Initialize i18n
import './i18n/config';

// Tailwind CSS
import './index.css';

// Hammer.js for touch gestures
import { HammerProvider } from './contexts/HammerContext';

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <HammerProvider>
            <App />
        </HammerProvider>
    </React.StrictMode>
);