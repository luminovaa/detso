FROM node:22-alpine

WORKDIR /src

# Install Chromium & dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    wqy-zenhei \
    dumb-init \
    udev \
    mesa-gl \
    libx11 \
    alsa-lib \
    && rm -rf /var/cache/apk/*

ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN mkdir -p /src/whatsapp-auth && chmod -R 777 /src/whatsapp-auth

COPY package.json yarn.lock ./
RUN yarn install
RUN yarn global add ts-node

COPY prisma ./prisma
RUN npx prisma db push
RUN npx prisma generate

COPY . .

EXPOSE 6589

# Jalankan pakai dumb-init supaya Chrome nggak zombie process
ENTRYPOINT ["dumb-init", "--"]
CMD ["ts-node", "index.ts"]
