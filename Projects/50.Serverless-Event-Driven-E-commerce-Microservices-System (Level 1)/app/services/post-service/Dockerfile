# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}
RUN npm config set //npm.pkg.github.com/:_authToken=$GITHUB_TOKEN

COPY .npmrc .npmrc

COPY package*.json ./

# Install dependencies
RUN npm install

COPY . ./post-service
#COPY . .

#WORKDIR /app/src
WORKDIR /app/post-service/src
# Expose the port the app runs on
EXPOSE 3003

# Define the command to run the application
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]