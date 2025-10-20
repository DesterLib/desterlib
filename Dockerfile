FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files for each package and app
COPY packages/*/package.json ./packages/*/
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Build the web app
WORKDIR /app
RUN pnpm build --filter=web

# Build the API
RUN pnpm build --filter=api

# Expose port
EXPOSE 3001

# Default command (production)
CMD ["pnpm", "start", "--filter=api"]
