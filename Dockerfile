# Rochester Law CMS - Production Docker Image
# Multi-stage build for optimized production deployment

# =============================================================================
# Base Stage - Common dependencies
# =============================================================================
FROM node:18-alpine AS base

# Set working directory
WORKDIR /app

# Install system dependencies needed for Prisma and other tools
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client \
    curl

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# =============================================================================
# Dependencies Stage - Install all dependencies
# =============================================================================
FROM base AS deps

# Install all dependencies (including devDependencies for build)
RUN npm ci

# Generate Prisma Client
RUN npx prisma generate

# =============================================================================
# Builder Stage - Build the application
# =============================================================================
FROM base AS builder

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Set environment variables for build
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV SKIP_ENV_VALIDATION=1

# Build the Next.js application
RUN npm run build

# =============================================================================
# Production Stage - Runtime image
# =============================================================================
FROM node:18-alpine AS runner

# Set working directory
WORKDIR /app

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies
RUN apk add --no-cache \
    libc6-compat \
    openssl \
    postgresql-client \
    curl \
    dumb-init

# Copy built application from builder stage
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy Prisma files
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Copy migration and setup scripts
COPY --from=builder /app/scripts ./scripts

# Create necessary directories
RUN mkdir -p ./uploads ./logs
RUN chown -R nextjs:nodejs ./uploads ./logs

# Set proper permissions
RUN chmod +x ./scripts/*.js

# Switch to non-root user
USER nextjs

# Expose port
EXPOSE 3000

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Default command
CMD ["node", "server.js"]

# =============================================================================
# Development Stage (optional) - For development with hot reload
# =============================================================================
FROM base AS development

# Install all dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source code
COPY . .

# Generate Prisma Client
RUN npx prisma generate

# Expose port for development
EXPOSE 3000

# Start development server
CMD ["npm", "run", "dev"]