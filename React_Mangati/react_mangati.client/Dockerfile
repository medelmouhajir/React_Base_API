# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all required dependencies based on your imports
RUN npm install
RUN npm install react-router-dom axios react-i18next i18next i18next-browser-languagedetector react-toastify hammerjs


# Copy source code
COPY . .

# Build the application
RUN npm run build

RUN sudo chmod +x node_modules/.bin/vite

# Development stage for hot-reloading
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies including dev dependencies
RUN npm install
RUN npm install react-router-dom axios react-i18next i18next i18next-browser-languagedetector react-toastify hammerjs

# Copy source code
COPY . .

# Set environment variable to indicate Docker
ENV DOCKER_CONTAINER=true

# Expose the dev server port
EXPOSE 54450

# Start Vite dev server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "54450"]