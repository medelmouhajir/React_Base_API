import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';

// Enhanced Docker/CI detection
const isDocker = process.env.DOCKER_CONTAINER === 'true' ||
    process.env.CI === 'true' ||
    !process.stdout.isTTY ||
    fs.existsSync('/.dockerenv') ||
    process.env.NODE_ENV === 'production';

let httpsConfig = {};
let target = 'https://localhost:7039';

// Only setup HTTPS certificates if not in Docker/CI environment
if (!isDocker) {
    const baseFolder =
        process.env.APPDATA !== undefined && process.env.APPDATA !== ''
            ? `${process.env.APPDATA}/ASP.NET/https`
            : `${process.env.HOME}/.aspnet/https`;

    const certificateName = "react_rentify.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    // Certificate setup code (keeping your existing logic)
    try {
        if (!fs.existsSync(baseFolder)) {
            fs.mkdirSync(baseFolder, { recursive: true });
        }

        if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
            const result = child_process.spawnSync('dotnet', [
                'dev-certs',
                'https',
                '--export-path',
                certFilePath,
                '--format',
                'Pem',
                '--no-password',
            ], { stdio: 'pipe' });

            if (result.status !== 0) {
                console.warn("Could not create certificate, continuing without HTTPS");
            }
        }

        if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
            httpsConfig = {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            };
        }
    } catch (error) {
        console.warn("Certificate creation failed, continuing without HTTPS:", error.message);
    }

    target = process.env.ASPNETCORE_HTTPS_PORT ?
        `https://localhost:${process.env.ASPNETCORE_HTTPS_PORT}` :
        process.env.ASPNETCORE_URLS ? process.env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7039';
}

// PWA Configuration
const pwaConfig = {
    registerType: 'autoUpdate',
    includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
    manifest: {
        name: 'Renter - Car Rental Management',
        short_name: 'Renter',
        description: 'Complete car rental management system',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        orientation: 'portrait-primary',
        icons: [
            {
                src: 'pwa-64x64.png',
                sizes: '64x64',
                type: 'image/png'
            },
            {
                src: 'pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png'
            },
            {
                src: 'pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
            },
            {
                src: 'maskable-icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
            }
        ],
        categories: ['business', 'productivity'],
        screenshots: [
            {
                src: 'screenshot-wide.png',
                sizes: '1280x720',
                type: 'image/png',
                form_factor: 'wide'
            },
            {
                src: 'screenshot-narrow.png',
                sizes: '750x1334',
                type: 'image/png',
                form_factor: 'narrow'
            }
        ]
    },
    strategies: 'injectManifest',
    srcDir: 'public',
    filename: 'sw.js',
    injectManifest: {
        swSrc: 'public/sw.js',
        swDest: 'dist/sw.js',
        injectionPoint: undefined,
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Don't include the service worker itself in the manifest
        dontCacheBustURLsMatching: /\.\w{8}\./,
        maximumFileSizeToCacheInBytes: 5000000, // 5MB
    },
    devOptions: {
        enabled: true,
        type: 'module'
    }
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        plugin(),
        VitePWA(pwaConfig)
    ],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    optimizeDeps: {
        include: ['react-toastify', '@microsoft/signalr']
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom'],
                    signalr: ['@microsoft/signalr']
                }
            }
        }
    },
    server: {
        host: '0.0.0.0',
        allowedHosts: true,
        port: parseInt(process.env.DEV_SERVER_PORT || '54350'),
        ...(isDocker ? {} : {
            proxy: {
                '^/hubs/notifications': {
                    target: target.replace('https', 'wss').replace('http', 'ws'),
                    ws: true,
                    secure: false,
                    changeOrigin: true
                }
            },
            ...(Object.keys(httpsConfig).length > 0 ? { https: httpsConfig } : {})
        })
    }
});