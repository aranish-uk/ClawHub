FROM node:20-alpine

# Install git and other dependencies
RUN apk add --no-cache git openssh

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npx prisma generate

RUN npm run build

EXPOSE 3001

CMD ["npm", "start"]
