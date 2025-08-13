# Tahap 1: Build TypeScript
FROM node:20-slim AS builder

WORKDIR /src

# Copy package files
COPY package.json yarn.lock ./
RUN yarn install --frozen-lockfile

# Install prisma & generate client
COPY prisma ./prisma
RUN yarn prisma generate

# Copy source dan build
COPY . .
RUN yarn build  # Asumsi kamu punya: "build": "tsc" di package.json


# Install Chrome (wajib untuk whatsapp-web.js)
RUN apt-get update && apt-get install -y \
    wget \
    gnupg \
    ca-certificates \
    libglib2.0-0 \
    libnss3 \
    libatk-bridge2.0-0 \
    libdrm-dev \
    libxkbcommon-dev \
    libxcomposite-dev \
    libxdamage-dev \
    libxrandr-dev \
    libgbm-dev \
    libasound2 \
    libxss1 \
    fonts-liberation \
    xdg-utils \
    && rm -rf /var/lib/apt/lists/*

# Tambahkan Google Chrome
RUN wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | gpg --dearmor > /usr/share/keyrings/google-chrome-keyring.gpg
RUN echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome-keyring.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list
RUN apt-get update && apt-get install -y google-chrome-stable

# Pindahkan build