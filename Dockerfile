# Use Bun for install & runtime
FROM oven/bun:1 AS base
WORKDIR /app

# Copy lockfiles first (if present) for better layer caching
COPY package.json bun.lockb* ./
RUN bun install

# Copy rest of the source
COPY . .

# Build the application
RUN bun run build

EXPOSE 3000

CMD ["bun", "build/index"]