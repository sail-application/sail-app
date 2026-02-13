# docker/Dockerfile
#
# Multi-stage production build for the SAIL Next.js application.
#
# Stage 1 (deps):    Install only production dependencies using npm ci.
# Stage 2 (builder): Copy source + deps, run the Next.js production build.
# Stage 3 (runner):  Minimal Alpine image running the standalone output.
#
# The standalone output mode (configured in next.config.ts) produces a
# self-contained server.js that includes only the files needed at runtime,
# keeping the final image small (~150 MB vs ~1 GB for a full node_modules).
#
# Build:  docker build -f docker/Dockerfile -t sail-app .
# Run:    docker run -p 3000:3000 --env-file .env.local sail-app

# ── Stage 1: Install dependencies ──
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts

# ── Stage 2: Build the Next.js application ──
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ── Stage 3: Production runtime ──
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create a non-root user for security (never run containers as root)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the files needed to run the standalone server
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Switch to the non-root user
USER nextjs

# Expose the default Next.js port
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Start the standalone Next.js server
CMD ["node", "server.js"]
