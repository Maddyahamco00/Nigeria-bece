FROM node:18-slim

WORKDIR /app

# Install app dependencies
COPY package*.json ./
RUN npm ci --only=production

# Bundle app source
COPY . .

ENV NODE_ENV=production
EXPOSE 3000

CMD [ "node", "app.js" ]
