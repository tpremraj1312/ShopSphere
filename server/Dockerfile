# ==============================================================================
# ShopSphere Server — Multi-Stage Production Dockerfile (5.3.1)
# ==============================================================================

# Stage 1: Build & Dependencies
FROM node:20-alpine AS dependencies
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache dumb-init

COPY package*.json ./
# Install production dependencies only
RUN npm ci --only=production --ignore-scripts

# Stage 2: Final Minimal Runtime Image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=5000

# Copy dumb-init for proper PID 1 signal forwarding
COPY --from=dependencies /usr/bin/dumb-init /usr/bin/dumb-init

# Copy node_modules from dependencies stage
COPY --from=dependencies /app/node_modules ./node_modules
COPY package*.json ./
COPY src ./src
COPY server.js ./

# Run as non-root user for security (SEC-13)
USER node

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/v1/health || exit 1

ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["node", "server.js"]
