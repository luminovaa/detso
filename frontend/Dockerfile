FROM node:22-alpine AS base

# === STAGE 1: Builder ===
FROM base AS builder
WORKDIR /app
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile
COPY . .
RUN yarn build

# === STAGE 2: Runner ===
FROM base AS runner
WORKDIR /app

# Buat user sistem
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Salin file dari builder
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next

# Ubah kepemilikan .next
RUN chown -R nextjs:nodejs .next && chmod -R 755 .next

USER nextjs

ENV NODE_ENV=production
ENV NEXT_RUNTIME=server
EXPOSE 3000

CMD ["yarn", "start"]
