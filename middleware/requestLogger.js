/*
Purpose:
Log every request: method, path, status code and how long it took
We log after the response is finished, because that is when the status is final
Body and headers are NOT logged (passwords and tokens live there)
*/

const logger = require("../utils/logger.js")

const requestLogger = (req, res, next) => {
    const start = Date.now()

    // "finish" fires once the response has been sent to the client
    res.on("finish", () => {
        const duration = Date.now() - start
        const message = `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - ip ${req.ip}`

        if(res.statusCode >= 500){
            logger.error(message)
        } else if(res.statusCode >= 400){
            logger.warn(message)
        } else {
            logger.info(message)
        }
    })

    next()
}

module.exports = requestLogger