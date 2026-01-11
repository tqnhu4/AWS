const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            //title: "Post Service API",
            version: "1.0.0",
            //description: "API Documentation for Post Microservice",
        },
        //servers:[
        //    {
        //        url: 'http://localhost:8080/posts',
        //        //url: 'http://post-service:3003',
        //        description: 'Post Service internal URL'
        //    }
        //]        
    },
    apis: [path.join(__dirname, "./*.js")],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
