FROM node:18-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Sidecar usually doesn't expose public ports, but we have a internal health check
EXPOSE 8081

CMD ["node", "index.js"]
