# Stage 1: Build Frontend
FROM node:20-alpine AS client-builder
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build Backend & Production Runner
FROM node:20-alpine
WORKDIR /app

# Install openssl for Prisma on alpine
RUN apk add --no-cache openssl

# Server setup
WORKDIR /app/server
COPY server/package*.json ./
RUN npm ci
COPY server/ ./
RUN npx prisma generate
RUN npm run build

# Copy compiled frontend from Stage 1 into client/dist
WORKDIR /app/client
COPY --from=client-builder /app/client/dist ./dist

# Create uploads directory
WORKDIR /app/server
RUN mkdir -p uploads

# Expose API and Frontend port
EXPOSE 5000

# Set environment
ENV PORT=5000
ENV NODE_ENV=production
ENV DATABASE_URL="file:./dev.db"

# Start database push, seed if empty, and launch
CMD sh -c "npx prisma db push && (node -e 'const { PrismaClient } = require(\"@prisma/client\"); const p = new PrismaClient(); p.user.count().then(c => { if(c === 0) { console.log(\"Seeding DB...\"); require(\"child_process\").execSync(\"npx ts-node prisma/seed.ts\"); } p.$disconnect(); });') && node dist/index.js"
