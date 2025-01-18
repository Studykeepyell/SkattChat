FROM node:20-slim

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    curl \
    libvips \
    libvips-dev \
    wget \
    && rm -rf /var/lib/apt/lists/*

# Set npm to use cache and be less verbose
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install backend dependencies with optimized flags
RUN cd backend && \
    npm ci --quiet --only=production && \
    npm install sharp --platform=linux --arch=x64 --quiet && \
    cd ..

# Copy compiled backend files
COPY backend/dist ./backend/dist

# Copy other necessary files
COPY public ./public

# Create directory for uploads
RUN mkdir -p backend/uploads

# Expose port for backend
EXPOSE 3001

# Set environment variables for production
ENV NODE_ENV=production \
    SHARP_IGNORE_GLOBAL_LIBVIPS=1

# Create a healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:${PORT}/api/health || exit 1

# Start production server
CMD ["node", "backend/dist/server.js"]
