# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all required dependencies based on your imports
RUN npm install
RUN npm install react-router-dom axios react-i18next i18next i18next-browser-languagedetector react-toastify hammerjs react-leaflet@^4.0.0

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Fix permissions for vite executable
RUN chmod +x node_modules/.bin/vite

# Development stage for hot-reloading
FROM node:20-alpine AS development

# Set working directory
WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create a non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

# Copy package files and change ownership
COPY --chown=nextjs:nodejs package*.json ./

# Install dependencies including dev dependencies
RUN npm install
RUN npm install react-router-dom axios react-i18next i18next i18next-browser-languagedetector react-toastify hammerjs react-leaflet@^4.0.0

# Copy source code and change ownership
COPY --chown=nextjs:nodejs . .

# Fix permissions for vite and all node_modules binaries
RUN chmod +x node_modules/.bin/*
RUN chown -R nextjs:nodejs node_modules/.bin

# Switch to non-root user
USER nextjs

# Set environment variable to indicate Docker
ENV DOCKER_CONTAINER=true

# Expose the dev server port
EXPOSE 54150

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start Vite dev server with host binding
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "51350"]
