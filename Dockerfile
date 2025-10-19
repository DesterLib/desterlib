FROM node:18-alpine

# Install pnpm
RUN npm install -g pnpm

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY turbo.json ./

# Copy package.json files for each package
COPY packages/*/package.json ./packages/*/
COPY apps/api/package.json ./apps/api/

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Generate Prisma client
WORKDIR /app/apps/api
RUN npx prisma generate

# Expose port
EXPOSE 3001

# Default command
CMD ["pnpm", "dev"]
