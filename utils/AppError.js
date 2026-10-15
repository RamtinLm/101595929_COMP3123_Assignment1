/*
Purpose:
A normal Error plus an HTTP status code
Throw it anywhere (controller, service) and the central error handler sends the right response
Example: throw new AppError(404, "Employee not found")
*/

class AppError extends Error {
    constructor(statusCode, message){
        super(message)
        this.name = "AppError"
        this.statusCode = statusCode
    }
}

module.exports = AppError
