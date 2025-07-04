import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
// Process is available globally in Node.js

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

    // Only try to create certificates if not in Docker and folders don't exist
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

        // Only set HTTPS if certificates exist
        if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
            httpsConfig = {
                key: fs.readFileSync(keyFilePath),
                cert: fs.readFileSync(certFilePath),
            };
        }
    } catch (error) {
        console.warn("Certificate creation failed, continuing without HTTPS:", error.message);
    }

    target = process.env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${process.env.ASPNETCORE_HTTPS_PORT}` :
        process.env.ASPNETCORE_URLS ? process.env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7039';
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
    },
    optimizeDeps: {
        include: ['react-toastify']
    },
    build: {
        outDir: 'dist',
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: {
                    vendor: ['react', 'react-dom']
                }
            }
        }
    },
    server: {
        host: '0.0.0.0',
        allowedHosts: true,
        port: parseInt(process.env.DEV_SERVER_PORT || '54450'),
        // Only add proxy and HTTPS in development (non-Docker)
        ...(isDocker ? {} : {
            proxy: {
                '^/weatherforecast': {
                    target,
                    secure: false
                }
            },
            ...(Object.keys(httpsConfig).length > 0 ? { https: httpsConfig } : {})
        })
    }
});