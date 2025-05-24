# Build stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install
RUN npm install axios

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install serve globally
RUN npm install -g serve

# Copy built assets from build stage
COPY --from=build /app/dist ./dist

# Copy package.json for reference
COPY --from=build /app/package.json ./

# Create a non-root user for security
RUN addgroup -g 1001 -S nodejs
RUN adduser -S reactuser -u 1001
USER reactuser

# Expose port
EXPOSE 54450

# Start the application - removed the invalid -H flag
CMD ["serve", "-s", "dist", "-l", "54450"]