FROM node:18-alpine
WORKDIR /app
#COPY package*.json ./
COPY swagger-service/package*.json ./
RUN npm install
#COPY . .
COPY swagger-service ./swagger-service



WORKDIR /app/swagger-service/src
EXPOSE 8080
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]
