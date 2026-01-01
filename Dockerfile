# Build stage
FROM node:20-alpine AS builder

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source
COPY . .

# Build Astro site
RUN pnpm build

# Production stage - use node to serve SSR
FROM node:20-alpine AS runner

# Install pnpm
RUN corepack enable && corepack prepare pnpm@9 --activate

WORKDIR /app

# Copy package files and install production deps
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

# Copy built assets
COPY --from=builder /app/dist ./dist

EXPOSE 4321

# Start the server
CMD ["node", "./dist/server/entry.mjs"]
