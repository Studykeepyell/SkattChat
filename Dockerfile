FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache python3 make g++ gcc

# Copy package files
COPY package*.json ./
COPY backend/package*.json ./backend/

# Install dependencies
RUN npm install --ignore-scripts
RUN cd backend && npm install --ignore-scripts

# Copy source files
COPY . .

# Build web files
RUN npm run build:web

# Second stage
FROM node:20-alpine AS backend

WORKDIR /app

# Install build dependencies and node-pre-gyp
RUN apk add --no-cache python3 make g++ gcc && \
    npm install -g node-pre-gyp

# Create backend directory and copy package files
RUN mkdir -p backend
COPY backend/package*.json backend/

# Install production dependencies and rebuild bcrypt
WORKDIR /app/backend
RUN npm install --omit=dev && \
    npm rebuild bcrypt --build-from-source

# Switch back to app directory
WORKDIR /app

# Copy built web files from builder stage
COPY --from=builder /app/public/dist ./public/dist
COPY --from=builder /app/public/assets ./public/assets
COPY --from=builder /app/public/styles ./public/styles
COPY --from=builder /app/public/index.html ./public/index.html
COPY --from=builder /app/public/favicon.ico ./public/favicon.ico

# Copy compiled backend files
COPY --from=builder /app/backend/dist ./backend/dist
COPY backend/.env ./backend/.env

# Expose port for backend
EXPOSE 3001

# Start the backend server using the compiled JS file
CMD ["node", "backend/dist/server.js"]
