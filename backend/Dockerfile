# Tahap 1: Build TypeScript
FROM node:22-alpine AS builder

WORKDIR /src

# Install chromium & deps
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wqy-zenhei \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install
RUN yarn global add ts-node

# Copy prisma schema & generate
COPY prisma ./prisma
RUN npx prisma generate

# Copy semua source code
COPY . .

EXPOSE 6589
CMD ["ts-node", "index.ts"]
