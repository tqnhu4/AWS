const swaggerJsDoc = require('swagger-jsdoc');
const path = require('path');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            //title: "User Service API",
            version: "1.0.0",
            //description: "API Documentation for User Microservice",
        },
        servers:[
            {
                url: 'http://localhost:3002/',
            }

        //    {
        //        url: 'http://localhost:8080/users',
        //        //url: 'http://user-service:3002',
        //        description: 'User Service internal URL'
        //    }
        ]        
    },
    apis: [path.join(__dirname, "./*.js")],
};

const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
