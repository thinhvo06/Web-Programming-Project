FROM node:22-alpine

WORKDIR /app

# Install build dependencies if needed
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source files
COPY . .

# Expose backend port
EXPOSE 5000

# Healthcheck
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Start backend server
CMD ["node", "src/server.js"]
