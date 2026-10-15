/*
Purpose:
Rate limiting: cap how many requests one IP can make in a time window
Login and signup get a strict limit (stops password guessing and spam accounts)
The rest of the API gets a looser general limit
Over the limit -> 429 Too Many Requests
*/

const rateLimit = require("express-rate-limit")
const logger = require("../utils/logger.js")

const FIFTEEN_MINUTES = 15 * 60 * 1000


// Runs when someone goes over the limit: log it and send JSON
const onLimitReached = (req, res, next, options) => {
    logger.warn(`Rate limit hit: ${req.method} ${req.originalUrl} from ip ${req.ip}`)

    res.status(options.statusCode).send({
        status: false,
        message: options.message
    })
}


// Each call makes a new limiter with its own counter
const createLimiter = (max, message) => {
    return rateLimit({
        windowMs: FIFTEEN_MINUTES,
        limit: max,
        standardHeaders: "draft-8", // sends RateLimit-Policy and RateLimit headers
        legacyHeaders: false,       // no old X-RateLimit-* headers
        message: message,
        handler: onLimitReached
    })
}


const AUTH_MAX = Number(process.env.AUTH_RATE_LIMIT_MAX) || 10
const API_MAX = Number(process.env.API_RATE_LIMIT_MAX) || 100

// Separate counters for login and signup
const loginLimiter = createLimiter(AUTH_MAX, "Too many login attempts, please try again in 15 minutes")
const signupLimiter = createLimiter(AUTH_MAX, "Too many signup attempts, please try again in 15 minutes")

// General limit for everything under /api
const apiLimiter = createLimiter(API_MAX, "Too many requests, please try again in 15 minutes")

module.exports = { loginLimiter, signupLimiter, apiLimiter }
