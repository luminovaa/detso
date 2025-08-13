FROM node:22-alpine AS base

# === STAGE 1: Builder ===
FROM base AS builder
COPY . .
RUN yarn install && yarn build
# === STAGE 2: Runner ===
# === STAGE 2: Runner ===
FROM base AS runner

# Buat user sistem
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# 🔥 PENTING: Salin package.json terlebih dahulu
COPY package.json ./

# Salin file dari builder
COPY --from=builder /public ./public
COPY --from=builder /.next/standalone ./.next/standalone
COPY --from=builder /.next/static ./.next/static
COPY --from=builder /node_modules ./node_modules

# 🔥 Buat folder cache dan atur ownership
RUN mkdir -p .next/cache && \
    chown -R nextjs:nodejs .next && \
    chmod -R 755 .next

# Gunakan user non-root
USER nextjs

# Environment
ENV NODE_ENV=production
ENV NEXT_RUNTIME=server

# Set working directory
WORKDIR /app

EXPOSE 3000

# Jalankan aplikasi
CMD ["yarn", "start"]