FROM oven/bun:1.3.5

WORKDIR /app

# Copy root package files
COPY package.json bun.lock ./

# Copy web package
COPY packages/web ./packages/web

# Install all dependencies
RUN bun install

# Build frontend (vite)
WORKDIR /app/packages/web
RUN bun run build:prod

# Expose port
EXPOSE 4200

# Start server
CMD ["bun", "run", "server.ts"]
