# Use Bun for install & runtime
FROM oven/bun:1 AS base
WORKDIR /app

# Copy lockfiles first (if present) for better layer caching
COPY package.json bun.lockb* ./
RUN bun install

# Copy rest of the source
COPY . .

EXPOSE 3000
# Dev server (Vite / SvelteKit) – adjust if you use a different script
CMD ["bun","run","dev","--","--host","0.0.0.0","--port","3000"]