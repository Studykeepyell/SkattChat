FROM node:20-slim AS builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    build-essential \
    curl \
    libvips \
    libvips-dev \
    && rm -rf /var/lib/apt/lists/*

# Optimize npm settings
ENV npm_config_loglevel=error \
    npm_config_progress=false \
    npm_config_fund=false \
    npm_config_audit=false \
    npm_config_update_notifier=false \
    NODE_ENV=production

# Copy only necessary files
COPY ./backend/package*.json ./backend/
COPY ./backend/dist ./backend/dist

# Install production dependencies
RUN cd backend && \
    npm ci --omit=dev && \
    npm install sharp --platform=linux --arch=x64 --quiet && \
    npm cache clean --force

# Copy frontend static files
COPY ./public ./public

# Production stage
FROM node:20-slim

WORKDIR /app

# Install only the essential runtime dependencies
RUN apt-get update && apt-get install -y \
    curl \
    libvips \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production \
    SHARP_IGNORE_GLOBAL_LIBVIPS=1

# Copy only necessary files from builder
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/backend/package.json ./backend/
COPY --from=builder /app/backend/node_modules ./backend/node_modules

# Create uploads directory
RUN mkdir -p backend/uploads

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3001/api/health || exit 1

CMD ["node", "backend/dist/server.js"]
