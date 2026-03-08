# ── Stage 1: Build React app ──────────────────────────────────────────────────
FROM node:18-alpine AS builder

WORKDIR /app

# Install dependencies first (cached layer)
COPY package.json package-lock.json* ./
RUN npm install --prefer-offline

# Pass PocketBase URL in at build time so the bundle knows where to point
ARG VITE_PB_URL=/pb
ENV VITE_PB_URL=$VITE_PB_URL

# Copy source and build
COPY . .
RUN npm run build

# ── Stage 2: Serve with nginx ─────────────────────────────────────────────────
FROM nginx:1.25-alpine

# Copy built app (Vite outputs to /dist)
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
