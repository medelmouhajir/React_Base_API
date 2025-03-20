import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';
import plugin from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { env } from 'process';

// Check if running in Docker
const isDocker = fs.existsSync('/.dockerenv') || env.DOCKER_CONTAINER;

// Configure HTTPS only when not in Docker
let httpsConfig = {};

if (!isDocker) {
    const baseFolder =
        env.APPDATA !== undefined && env.APPDATA !== ''
            ? `${env.APPDATA}/ASP.NET/https`
            : `${env.HOME}/.aspnet/https`;

    const certificateName = "react_lawyer.client";
    const certFilePath = path.join(baseFolder, `${certificateName}.pem`);
    const keyFilePath = path.join(baseFolder, `${certificateName}.key`);

    if (fs.existsSync(certFilePath) && fs.existsSync(keyFilePath)) {
        httpsConfig = {
            key: fs.readFileSync(keyFilePath),
            cert: fs.readFileSync(certFilePath),
        };
    }
}

//const target = 'http://localhost:5267';
const target = env.aspnetcore_https_port ? `https://localhost:${env.aspnetcore_https_port}` :
    env.ASPNETCORE_URLS ? env.ASPNETCORE_URLS.split(';')[0] : 'http://localhost:5267';

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
            '^/weatherforecast': {
                target,
                secure: false
            }
        },
        port: parseInt(env.DEV_SERVER_PORT || '54440'),
        https: Object.keys(httpsConfig).length > 0 ? httpsConfig : false
    }
})