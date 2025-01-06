# Use Node.js base image with alpine for smaller size
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first (better layer caching)
COPY package*.json ./

# Install dependencies with clean npm cache
RUN npm install && \
    npm cache clean --force

# Copy only necessary project files with organized structure
COPY public/assets ./public/assets
COPY public/scripts ./public/scripts
COPY public/styles ./public/styles
COPY public/pages ./public/pages
COPY public/Games ./public/Games
COPY public/index.html ./public/index.html
COPY tsconfig*.json ./
COPY vite.config.* ./

# Build the application
RUN npm run build

# Use a smaller base image for production
FROM nginx:alpine

# Copy built files from previous stage
COPY --from=0 /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 80 for nginx
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
