# Base stage
FROM node:18-alpine AS base
WORKDIR /app

# Install system dependencies for native builds and ffmpeg package (transcoding stage requires it)
RUN apk add --no-cache python3 make g++ ffmpeg

# Copy package settings
COPY package*.json ./
RUN npm ci --only=production

# --- API Gateway Target ---
FROM base AS gateway
COPY src ./src
EXPOSE 5000
CMD ["npm", "start"]

# --- Transcoder Target ---
FROM base AS transcoder
WORKDIR /app
COPY services/transcoding ./services/transcoding
COPY src ./src
WORKDIR /app/services/transcoding
RUN npm ci --only=production
EXPOSE 5001
CMD ["npm", "start"]

# --- Notifier Target ---
FROM base AS notifier
WORKDIR /app
COPY services/notification ./services/notification
COPY src ./src
WORKDIR /app/services/notification
RUN npm ci --only=production
EXPOSE 5002
CMD ["npm", "start"]
