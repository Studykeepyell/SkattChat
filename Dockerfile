FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY src ./src
COPY backend ./backend
COPY public ./public
COPY tsconfig*.json ./
COPY vite.config.* ./

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built frontend from builder stage
COPY --from=builder /app/dist ./dist

# Copy backend files
COPY --from=builder /app/backend ./backend

# Expose port for the Node.js backend
EXPOSE 3000

# Start the application
CMD ["npm", "start"]
