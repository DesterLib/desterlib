FROM node:20-alpine

# Install git, pnpm and build dependencies for native modules
RUN apk add --no-cache git python3 make g++ postgresql-client wget && \
    npm install -g pnpm

# Build arguments for repository cloning
ARG REPO_URL=https://github.com/DesterLib/desterlib.git
ARG REPO_BRANCH=main

# Set working directory
WORKDIR /app

# Clone the repository
RUN echo "Cloning DesterLib repository from ${REPO_URL} (branch: ${REPO_BRANCH})..." && \
    git clone --depth 1 --branch ${REPO_BRANCH} ${REPO_URL} . || \
    (echo "Failed to clone with branch, trying without branch specification..." && \
     git clone --depth 1 ${REPO_URL} . && \
     git checkout ${REPO_BRANCH} 2>/dev/null || echo "Using default branch")

# Install dependencies (with fallback for optional deps)
RUN pnpm install --no-frozen-lockfile

# Generate Prisma client and prepare database
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the API only
WORKDIR /app
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

echo "Starting DesterLib API server on port ${PORT:-3001}..."
npm start
EOF

RUN chmod +x /app/start.sh

# Expose port
EXPOSE 3001

# Default command (production)
CMD ["/app/start.sh"]
