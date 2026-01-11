const express = require("express");
const swaggerUi = require("swagger-ui-express");
const axios = require("axios");
const mergeWith = require("lodash.mergewith");
const morgan = require("morgan");

const app = express();
app.use(morgan("dev"));

const services = [
    "http://user-service:3002/openapi.json",
    "http://post-service:3003/openapi.json"
];


// Schema merge
let combinedSchema = {
    openapi: "3.0.0",
    info: {
        title: "Unified API Docs",
        version: "1.0.0"
    },
    paths: {},
    components: {}
};

// merge schema each service
async function refreshSchema() {
    console.log("Refreshing OpenAPI schemas...");
    let newSchema = {
        openapi: "3.0.0",
        info: {
            title: "Microservice API Docs",
            version: "1.0.0"
        },
        servers:[
            {
                url: 'http://localhost:8080/',
                description: 'Service internal URL'
            }
        ],        
        paths: {},
        components: {
            securitySchemes:{
                bearerAuth:{
                    type: "http",
                    scheme: "bearer",
                    bearerFormat: "JWT"
                }
            }
        }
    };

    for (const url of services) {
        try {
            const { data } = await axios.get(url);
            mergeWith(newSchema, data);
        } catch (err) {
            console.error(`Cannot load schema from ${url}`);
        }
    }

    combinedSchema = newSchema;
    console.log("Schema refreshed");
}

// Refresh each 30 second
setInterval(refreshSchema, 30 * 1000);

// Refresh the first time at start
refreshSchema();

// Mount Swagger UI
app.use("/docs", swaggerUi.serve, (req, res, next) => {
    swaggerUi.setup(combinedSchema)(req, res, next);
});

// Endpoint
app.get("/openapi.json", (req, res) => {
    res.json(combinedSchema);
});

app.listen(8080, () => console.log(`Swagger Service running on port 8080`));
