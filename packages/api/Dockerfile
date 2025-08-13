FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

# Copy the entire workspace
COPY package*.json ./
COPY packages/api/package*.json ./packages/api/
COPY packages/web/package*.json ./packages/web/

# Install dependencies
RUN npm install

# Rebuild the source code only when needed
FROM base AS builder
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Generate Prisma client
RUN npx prisma generate --schema=./packages/api/prisma/schema.prisma

# Build the API application
WORKDIR /app/packages/api
RUN npm run build

# Production image, copy all the files and run the app
FROM base AS runner
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the built application
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/dist ./dist
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/packages/api/package.json ./package.json

USER nextjs

EXPOSE 3001

ENV PORT 3001

CMD ["node", "dist/index.js"]
