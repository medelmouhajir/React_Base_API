import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import child_process from 'child_process';
import { env } from 'process';

// Check if we're in a Docker environment or CI/CD
const isDocker = env.DOCKER_CONTAINER === 'true' || env.CI === 'true' || !process.stdout.isTTY;

let httpsConfig = {};
let target = 'https://localhost:7039';

// Only setup HTTPS certificates if not in Docker/CI environment
if (!isDocker) {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const certificateName = "react_mangati.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (!fs.existsSync(baseFolder)) {
        fs.mkdirSync(baseFolder, { recursive: true });
    }

    if (!fs.existsSync(certFilePath) || !fs.existsSync(keyFilePath)) {
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
                console.warn("Could not create certificate.");
            }
        } catch (error) {
            console.warn("Certificate creation failed:", error.message);
        }
    }

    // Only set HTTPS if certificates exist
    if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
        httpsConfig = {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        };
    }

    target = env.ASPNETCORE_HTTPS_PORT ? `https://localhost:${env.ASPNETCORE_HTTPS_PORT}` :
        env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'https://localhost:7039';
}

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [plugin()],
    resolve: {
        alias: {
            '@': fileURLToPath(new URL('./src', import.meta.url))
        }
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
        port: parseInt(env.DEV_SERVER_PORT || '54450'),
        // Only add proxy and HTTPS in development (non-Docker)
        ...(isDocker ? {} : {
            proxy: {
                '^/weatherforecast': {
                    target,
                    secure: false
                }
            },
            https: httpsConfig
        })
    }
});