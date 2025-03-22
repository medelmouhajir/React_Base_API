# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install MUI dependencies first
RUN npm install @emotion/react @emotion/styled @mui/material @mui/icons-material

# Install dependencies
RUN npm ci

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install serve to run the application
RUN npm install -g serve

# Copy built assets from the build stage
COPY --from=build /app/dist ./dist

# Copy necessary files for development mode
COPY package*.json ./
COPY vite.config.js ./
COPY eslint.config.js ./
COPY public ./public
COPY src ./src

# Install production dependencies
RUN npm install @emotion/react @emotion/styled @mui/material @mui/icons-material

# Install only production dependencies when running in production mode
RUN npm ci --omit=dev

# Install dev dependencies for development mode (will be used by npm run dev)
RUN npm install

# Expose the port specified in the environment variable or default to 54440
EXPOSE 54440

# Start the application in development mode by default
# This allows hot reloading when in development
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]