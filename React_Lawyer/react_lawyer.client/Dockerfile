FROM node:20-alpine

WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the application
COPY . .

# Expose port for development server
EXPOSE 54440

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]