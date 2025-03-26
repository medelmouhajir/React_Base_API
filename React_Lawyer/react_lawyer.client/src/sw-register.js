// src/sw-register.js
export function registerServiceWorker() {
    // Only register in production to avoid MIME type errors during development
    if ('serviceWorker' in navigator && import.meta.env.PROD) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);
                })
                .catch(error => {
                    console.error('ServiceWorker registration failed: ', error);
                });
        });
    } else {
        console.log('Service Worker not registered: Development environment or browser does not support Service Workers');
    }
}