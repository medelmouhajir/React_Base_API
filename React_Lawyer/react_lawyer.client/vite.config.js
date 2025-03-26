import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

const baseFolder =
    env.APPDATA !== undefined && env.APPDATA !== ''
        ? `${env.APPDATA}/ASP.NET/https`
        : `${env.HOME}/.aspnet/https`;

const certificateName = "react_lawyer.client";
const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

// In Docker environment, we might not need to create certificates
let httpsConfig = {};

if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
    httpsConfig = {
        key: fs.readFileSync(keyFilePath),
        cert: fs.readFileSync(certFilePath),
    };
} else if (!env.DOCKER_CONTAINER && !fs.existsSync(baseFolder)) {
    fs.mkdirSync(baseFolder, { recursive: true });

    try {
        if (0 !== child_process.spawnSync('dotnet', [
            'dev-certs',
            'https',
            '--export-path',
            certFilePath,
            '--format',
            'Pem',
            '--no-password',
        ], { stdio: 'inherit', }).status) {
            console.warn("Could not create certificate, HTTPS will not be available");
        } else {
            httpsConfig = {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            };
        }
    } catch (e) {
        console.warn("Error creating certificates:", e);
    }
}

// Determine the backend API URL - when running in Docker, use the service name
const isInDocker = env.DOCKER_CONTAINER === 'true';
const backendTarget = isInDocker
    ? 'http://react_lawyer.server:8080'
    : env.ASPNETCORE_HTTPS_PORT
        ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}`
        : env.ASPNETCORE_URLS
            ? env.ASPNETCORE_URLS.split(';')[0].replace('+', 'localhost')
            : 'https://localhost:7068';

console.log(`Backend API target: ${backendTarget}`);

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        plugin(),
        VitePWA({
            registerType: 'autoUpdate',
            includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
            manifest: {
                name: 'React Lawyer Office Management',
                short_name: 'Lawyer App',
                description: 'Law Office Management System for managing cases, clients, and legal workflow',
                theme_color: '#1a237e',
                background_color: '#ffffff',
                display: 'standalone',
                icons: [
                    {
                        src: '/icons/icon-192x192.png',
                        sizes: '192x192',
                        type: 'image/png',
                        purpose: 'any maskable'
                    },
                    {
                        src: '/icons/icon-512x512.png',
                        sizes: '512x512',
                        type: 'image/png',
                        purpose: 'any maskable'
                    }
                ]
            },
            strategies: 'generateSW', // Use generateSW strategy instead of injectManifest
            filename: 'sw-workbox.js', // Custom name to avoid conflict with manual sw.js
            workbox: {
                globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
                cleanupOutdatedCaches: true,
                sourcemap: true,
                runtimeCaching: [
                    {
                        urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'google-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    },
                    {
                        urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
                        handler: 'CacheFirst',
                        options: {
                            cacheName: 'gstatic-fonts-cache',
                            expiration: {
                                maxEntries: 10,
                                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                            },
                            cacheableResponse: {
                                statuses: [0, , 200]
                            }
                        }
                    },
                    {
                        urlPattern: /\/api\/.*/i,
                        handler: 'NetworkFirst',
                        options: {
                            cacheName: 'api-cache',
                            expiration: {
                                maxEntries: 50,
                                maxAgeSeconds: 60 * 60 // 1 hour
                            },
                            cacheableResponse: {
                                statuses: [0, 200]
                            }
                        }
                    }
                ]
            }
        })
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    server: {
        proxy: {
            '/weatherforecast': {
                target: backendTarget,
                secure: false,
                changeOrigin: true
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '54440'),
        host: '0.0.0.0',
        ...(Object.keys(httpsConfig).length > 0 ? { https: httpsConfig } : {})
    }
});