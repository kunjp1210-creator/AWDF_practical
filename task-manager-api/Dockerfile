# Step 2: Backend Dockerfile for Node.js / Express API
FROM node:18-alpine

# Set container working directory
WORKDIR /app

# Install dependencies first to leverage Docker layer caching
COPY package*.json ./
RUN npm install --production=false

# Copy application source code
COPY . .

# Expose backend API port
EXPOSE 5001

# Start the Node.js Express server
CMD ["node", "server.js"]
