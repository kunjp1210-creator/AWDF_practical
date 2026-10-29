# Step 3: Frontend Dockerfile (Multi-stage build for React + Vite)

# --- Stage 1: Build Stage ---
FROM node:18-alpine AS build
WORKDIR /app

# Copy dependency manifests and install dependencies
COPY package*.json ./
RUN npm install

# Copy application source code and compile production assets
COPY . .
RUN npm run build

# --- Stage 2: Serve Stage ---
FROM node:18-alpine AS serve
WORKDIR /app

# Copy package config and built assets from the build stage
COPY --from=build /app/package*.json ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist

# Expose frontend port
EXPOSE 5173

# Serve the production build using Vite preview bound to all network interfaces
CMD ["npm", "run", "preview", "--", "--host", "0.0.0.0", "--port", "5173"]
