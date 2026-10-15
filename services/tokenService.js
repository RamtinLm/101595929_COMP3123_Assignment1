/*
Purpose:
Create and check JWTs in one place
The token proves who the user is, it is signed with JWT_SECRET so nobody can fake or edit it
*/

const jwt = require("jsonwebtoken")


// Create a token after a successful login
// Only put non-secret info in the payload, anyone can decode it (it is signed, not encrypted)
const generateToken = (user) => {
    const payload = {
        id: user._id.toString(),
        username: user.username
    }

    return jwt.sign(payload, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || "1h",
        algorithm: "HS256"
    })
}


// Check a token, throws an error if it is invalid, edited or expired
// algorithms is pinned so an attacker cannot switch the algorithm in the token header
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ["HS256"]
    })
}

module.exports = { generateToken, verifyToken }
