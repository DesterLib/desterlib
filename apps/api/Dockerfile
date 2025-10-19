# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy all package.json files to establish workspace structure
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/ ./packages/

# Install all dependencies
RUN pnpm install --frozen-lockfile

# Copy source code for both API and web app
COPY apps/api ./apps/api
COPY apps/web ./apps/web

# Generate Prisma Client
WORKDIR /app/apps/api
RUN pnpm prisma generate

# Build both API and web app from the monorepo root to handle dependencies properly
WORKDIR /app
RUN pnpm turbo build --filter=api --filter=web

# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Create minimal workspace structure for production
COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/pnpm-workspace.yaml ./

# Copy API package.json and any required workspace packages
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY --from=builder /app/packages/typescript-config ./packages/typescript-config/

# Install only production dependencies for the API and its workspace dependencies
RUN pnpm install --prod --frozen-lockfile --filter=api

# Switch to the api directory for runtime
WORKDIR /app/apps/api

# Copy built application files to the correct location
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/apps/api/prisma ./prisma
# Ensure generated Prisma client is available in both locations for compatibility
COPY --from=builder /app/apps/api/src/generated ./src/generated
RUN mkdir -p ./dist/generated && cp -r ./src/generated/* ./dist/generated/

# Copy built web app files so the API can serve them
COPY --from=builder /app/apps/web/dist ./web/dist

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Install netcat for healthcheck and PostgreSQL client tools for backups
RUN apk add --no-cache netcat-openbsd postgresql-client

# Create logs directory
RUN mkdir -p logs backups

# Generate Prisma Client for production
RUN pnpm prisma generate

# Set environment
ENV NODE_ENV=production
# Set Node.js heap size to 512MB (adjust based on your needs)
ENV NODE_OPTIONS="--max-old-space-size=512"

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "dist/index.js"]

