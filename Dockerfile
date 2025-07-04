# Stage 1: Build environment
# Using a Node.js Alpine-based image for a smaller footprint
FROM node:18-alpine AS build

# Set the working directory inside the container
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
# This step ensures that npm dependencies are reinstalled only if package*.json changes
COPY package*.json ./

# Install project dependencies
# --legacy-peer-deps is included as it was in your original Dockerfile,
# which can help resolve peer dependency conflicts in some npm versions/projects.
RUN npm install --legacy-peer-deps

# Copy the entire source code into the working directory
# This includes all your Angular project files
COPY . .

# Build the Angular application for production
# This command typically compiles your Angular code into static assets
# and places them in a 'dist' directory (e.g., /app/dist/CheckScam-admin/browser)
RUN npm run build

# This Dockerfile now only contains the build stage.
# The resulting image will have the built Angular application located at
# /app/dist/CheckScam-admin/browser within the image.
# You can then use this image as a base for a different serving mechanism
# or extract the build artifacts from it.
