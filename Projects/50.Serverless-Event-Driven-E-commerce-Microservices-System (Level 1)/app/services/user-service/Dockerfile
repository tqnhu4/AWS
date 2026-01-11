# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

ARG GITHUB_TOKEN
ENV GITHUB_TOKEN=${GITHUB_TOKEN}

COPY .npmrc .npmrc

# Copy package.json and package-lock.json (if available) to the working directory
COPY package*.json ./

# Install dependencies

# Copy the rest of the application code to the working directory
#COPY ../shared-lib ./shared-lib

#RUN npm install ./shared-lib
RUN npm install

#COPY shared-lib ./shared-lib
#COPY user-service ./
#COPY user-service ./user-service
#COPY . .
COPY . ./user-service

#WORKDIR /app/src
WORKDIR /app/user-service/src
# Expose the port the app runs on
EXPOSE 3002

# Define the command to run the application
#CMD ["npm", "start"]
CMD ["npm", "run", "dev"]