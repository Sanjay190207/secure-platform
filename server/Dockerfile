# Stage 1: Build & Production Dependencies
FROM node:20-alpine AS build

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Stage 2: Final Lightweight Image
FROM node:20-alpine

WORKDIR /app

# Copy built app and dependencies
COPY --from=build /app ./

# Set environment defaults
ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

# Run Express server
CMD ["node", "src/server.js"]
