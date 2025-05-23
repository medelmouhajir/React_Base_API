# Use the latest LTS version of Node.js
FROM node:20-alpine AS build
 
# Set the working directory inside the container
WORKDIR /app
 
# Copy package.json and package-lock.json
COPY package*.json ./
 
# Install dependencies
RUN npm install
 
# Copy the rest of your application files
COPY . .
 
WORKDIR /app
# Install serve to run the application
RUN npm install -g serve



# Install dependencies with legacy peer deps to avoid conflicts
RUN npm install --legacy-peer-deps
# Expose the port your app runs on
EXPOSE 54450
 
# Define the command to run 