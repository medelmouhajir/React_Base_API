import { fileURLToPath, URL } from 'node:url';

import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
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
    plugins: [plugin()],
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
})