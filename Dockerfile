FROM node:20-slim AS builder

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./
COPY server/package*.json ./server/

# Install dependencies (including devDependencies for Typescript build)
# We need to install in root AND server because they might share/split deps
RUN npm install
RUN cd server && npm install

# Copy source code
COPY . .

# Build the server
WORKDIR /app/server
RUN npm run build

# Runtime stage
FROM node:20-slim

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=builder /app/server/package*.json ./
COPY --from=builder /app/server/dist ./dist
COPY --from=builder /app/server/node_modules ./node_modules

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "dist/server/index.js"]
