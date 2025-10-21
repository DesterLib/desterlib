FROM node:20-alpine

# Install pnpm and build dependencies for native modules
RUN apk add --no-cache python3 make g++ postgresql-client wget && \
    npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files for better Docker layer caching
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files for each workspace
COPY packages/typescript-config/package.json ./packages/typescript-config/
COPY packages/eslint-config/package.json ./packages/eslint-config/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies (with fallback for optional deps)
RUN pnpm install --no-frozen-lockfile

# Copy the rest of the source code
COPY . .

# Generate Prisma client and prepare database
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the web app first
WORKDIR /app
RUN pnpm build --filter=web

# Copy web dist files to API directory for serving
# This ensures static files are available in the correct location for serving
RUN mkdir -p apps/api/web && \
    if [ -d "apps/web/dist" ]; then \
        cp -r apps/web/dist/* apps/api/web/dist/ 2>/dev/null || \
        cp -r apps/web/dist apps/api/web/dist; \
    else \
        echo "Warning: apps/web/dist directory not found after build"; \
    fi

# Verify the static files are in place for debugging
RUN ls -la apps/api/web/dist/ && echo "Static files copied successfully" && \
    find apps/api/web/dist -name "*.js" -o -name "*.css" -o -name "*.html" | head -10

# Build the API
RUN pnpm build --filter=api

# Create startup script for database initialization
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "=== DesterLib Container Startup ==="
echo "Waiting for database to be ready..."
until pg_isready -h ${POSTGRES_HOST:-postgres} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-postgres}; do
  echo "Database is unavailable - sleeping"
  sleep 2
done
echo "Database is ready!"

# Push database schema
cd /app/apps/api
echo "Running Prisma database push..."
npx prisma db push --accept-data-loss

# Start the application
cd /app/apps/api
echo "Starting application..."
echo "Current working directory: $(pwd)"
echo "Checking for web dist directory:"
if [ -d "web/dist" ]; then
  echo "Web dist directory found, contents:"
  ls -la web/dist/ | head -20
else
  echo "WARNING: Web dist directory not found at expected location"
  echo "Attempting to locate web files..."
  find /app -name "index.html" -path "*/dist/*" 2>/dev/null || echo "No web dist found"
fi

echo "Starting DesterLib API server on port ${PORT:-3001}..."
npm start
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Default command (production)
CMD ["/app/start.sh"]
