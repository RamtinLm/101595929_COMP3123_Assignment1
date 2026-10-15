/*
Purpose:
Authentication middleware for protected routes
Reads "Authorization: Bearer <token>", verifies it and puts the user on req.user
Rejects missing, invalid and expired tokens with 401
The full token is never logged
*/

const User = require("../models/UserModel.js")
const { verifyToken } = require("../services/tokenService.js")
const logger = require("../utils/logger.js")


const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization

    // 1. Missing header, or not in the "Bearer <token>" format
    if(!authHeader || !authHeader.startsWith("Bearer ")){
        logger.warn(`Auth failed: missing token on ${req.method} ${req.originalUrl}`)
        return res.status(401).send({
            status: false,
            message: "Access denied, no token provided"
        })
    }

    const token = authHeader.split(" ")[1]

    // 2. Check the signature and expiry
    let decoded

    try{
        decoded = verifyToken(token)
    } catch(err){
        if(err.name === "TokenExpiredError"){
            logger.warn(`Auth failed: expired token on ${req.method} ${req.originalUrl}`)
            return res.status(401).send({
                status: false,
                message: "Token has expired, please log in again"
            })
        }

        logger.warn(`Auth failed: invalid token on ${req.method} ${req.originalUrl}`)
        return res.status(401).send({
            status: false,
            message: "Invalid token"
        })
    }

    // 3. The token is valid, but make sure the user still exists
    const userExists = await User.exists({ _id: decoded.id })

    if(!userExists){
        logger.warn(`Auth failed: token for a user that no longer exists (${decoded.id})`)
        return res.status(401).send({
            status: false,
            message: "User for this token no longer exists"
        })
    }

    // 4. Identity comes ONLY from the verified token, never from the request body
    req.user = {
        id: decoded.id,
        username: decoded.username
    }

    next()
}

module.exports = authenticate
