FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install all deps including devDeps for build (override NODE_ENV)
RUN npm ci --include=dev

COPY . .

RUN npm run build && ls -la dist/

# ---- Runtime stage ----
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

# Install only production deps
RUN npm ci --omit=dev && npx prisma generate

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
