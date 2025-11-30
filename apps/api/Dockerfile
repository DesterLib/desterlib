FROM node:20-alpine

# Install build dependencies for native modules and postgresql-client
RUN apk add --no-cache python3 make g++ postgresql-client wget

# Install pnpm globally
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy workspace configuration files
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY turbo.json ./

# Copy all packages (needed for workspace dependencies)
COPY packages ./packages

# Copy API source code
COPY apps/api ./apps/api

# Install dependencies
RUN pnpm install --frozen-lockfile

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API
WORKDIR /app
RUN pnpm build --filter=api

# Create startup script for database initialization
RUN cat > /app/start.sh << 'EOF'
#!/bin/sh
set -e

echo "=== DesterLib API Container Startup ==="
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

echo "Starting DesterLib API server on port ${PORT:-3001}..."
npm start
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Default command (production)
CMD ["/app/start.sh"]

