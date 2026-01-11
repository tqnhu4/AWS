
const { createLogger, format, transports } = require('winston');

function buildLogger(serviceName) {
  return createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
      format.errors({ stack: true }),
      format.json()
    ),
    defaultMeta: {
      service: serviceName,
      env: process.env.NODE_ENV || 'development'
    },
    transports: [
      new transports.Console()
    ]
  });
}

module.exports = buildLogger;
