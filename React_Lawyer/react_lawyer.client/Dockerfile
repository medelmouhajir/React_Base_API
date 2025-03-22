# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Update package.json to use compatible vite-plugin-pwa version
RUN npm pkg set devDependencies.vite-plugin-pwa="^0.17.4"
RUN npm pkg set devDependencies.vite="^5.0.12"
RUN npm pkg set dependencies.react="^18.2.0"
RUN npm pkg set dependencies.react-dom="^18.2.0"

# Install dependencies with legacy peer deps flag to avoid conflicts
RUN npm install --legacy-peer-deps

# Copy all necessary files
COPY . .

# Create the missing sw-register.js file in the src directory
RUN mkdir -p src
RUN echo '// Service worker registration for PWA support\n\nexport function registerServiceWorker() {\n  if (\"serviceWorker\" in navigator) {\n    window.addEventListener(\"load\", () => {\n      navigator.serviceWorker.register(\"/sw.js\")\n        .then(registration => {\n          console.log(\"ServiceWorker registration successful with scope: \", registration.scope);\n        })\n        .catch(error => {\n          console.log(\"ServiceWorker registration failed: \", error);\n        });\n    });\n  }\n}' > src/sw-register.js

# List contents to verify file structure
RUN ls -la src/

# Build the application with legacy peer deps
RUN npm run build --legacy-peer-deps

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built assets from the build stage
COPY --from=build /app/dist ./dist

# Copy necessary files for development mode
COPY --from=build /app/package.json ./
COPY --from=build /app/vite.config.js ./
COPY --from=build /app/eslint.config.js ./
COPY --from=build /app/public ./public
COPY --from=build /app/src ./src

# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps

# Expose the port
EXPOSE 54440

# Start the application in development mode
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]