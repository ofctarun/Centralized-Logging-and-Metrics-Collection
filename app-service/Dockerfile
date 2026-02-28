FROM node:18-slim

WORKDIR /app

# Install curl for healthcheck
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install

COPY . .

# Create log directory and set permissions
RUN mkdir -p /var/log/app && touch /var/log/app/app.log && chmod -R 777 /var/log/app

EXPOSE 3000

CMD ["node", "index.js"]
