//export * as eventBus from "./src/event-bus/index.js";
const eventBus = require('./src/event-bus/index.js');
const discoveryClient = require('./src/service-discovery/index.js');
const authenticateToken = require('./src/authenticate-token/index.js');
const {buildLogger,requestLogger} = require('./src/logger/index.js');

//console.log('discoveryClient:', discoveryClient);
//console.log('register fn?:', discoveryClient && discoveryClient.register);

module.exports = { eventBus , discoveryClient, authenticateToken, buildLogger,requestLogger};