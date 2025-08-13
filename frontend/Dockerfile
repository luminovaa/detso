FROM node:22-alpine AS base

# === STAGE 1: Builder ===
FROM base AS builder
COPY . .
RUN yarn install && yarn build
# === STAGE 2: Runner ===
FROM base AS runner

# Buat user sistem
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin file dari builder
COPY --from=builder /public ./public
COPY --from=builder /.next/standalone ./.next/standalone
COPY --from=builder /.next/static ./.next/static
COPY --from=builder /node_modules ./node_modules

# 🔥 Penting: Buat folder .next/cache dan set ownership ke nextjs
RUN mkdir -p .next/cache && \
    chown -R nextjs:nodejs .next && \
    chmod -R 755 .next

# Gunakan user non-root
USER nextjs

# Pastikan environment untuk standalone
ENV NODE_ENV=production

# Set the working directory to the location of package.json
WORKDIR /app

# Expose port 3000
EXPOSE 3000

# Command to start the application
CMD ["yarn", "start"]