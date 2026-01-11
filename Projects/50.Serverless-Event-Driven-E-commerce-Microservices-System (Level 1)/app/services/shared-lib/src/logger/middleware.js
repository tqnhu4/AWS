const { v4: uuidv4 } = require("uuid");

function requestLogger(logger) {
	return (req, res, next) => {
		const traceId = uuidv4();

		req.traceId = traceId;

		logger.info({
			message: "Incoming request",
			method: req.method,
			url: req.originalUrl,
			traceId
		});

		res.on("finish", () => {
			logger.info({
				message: "Request completed",
				statusCode: res.statusCode,
				method: req.method,
				url: req.originalUrl,
				traceId
			});
		});

		next();
	};
}

module.exports = requestLogger;
