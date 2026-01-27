# Multi-stage Docker build for production optimization
FROM node:18-alpine AS base

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

WORKDIR /app

# Dependencies stage
FROM base AS dependencies
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Development dependencies stage
FROM dependencies AS dev-dependencies
RUN npm ci && npm cache clean --force

# Build stage
FROM dev-dependencies AS build
COPY . .
RUN npm run build

# Production stage
FROM base AS production

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Copy built application
COPY --from=build --chown=nextjs:nodejs /app/dist ./dist
COPY --from=dependencies --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --chown=nextjs:nodejs package*.json ./

# Switch to non-root user
USER nextjs

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (res) => { \
    process.exit(res.statusCode === 200 ? 0 : 1) \
  }).on('error', () => process.exit(1))"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]
CMD ["npm", "start"]
