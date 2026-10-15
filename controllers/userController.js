/*
Purpose:
Handles the user routes: signup and login
Validation already happened before we get here (validators/userValidator.js)
No try/catch: Express 5 sends any thrown error to the central error handler by itself
*/

const User = require("../models/UserModel.js")
const { generateToken } = require("../services/tokenService.js")
const logger = require("../utils/logger.js")


// SIGNUP a new user
// POST http://localhost:8081/api/v1/user/signup
const signup = async (req, res) => {
    const { username, email, password } = req.body

    // Check both at once so we can tell the client which one is taken
    const existingUser = await User.findOne({
        $or: [{ username: username }, { email: email }]
    })

    if(existingUser){
        const takenField = existingUser.username === username ? "Username" : "Email"

        logger.warn(`Signup rejected: ${takenField.toLowerCase()} already exists`)
        return res.status(409).send({
            status: false,
            message: `${takenField} already exists`
        })
    }

    // The pre-save hook in the model hashes the password
    const user = await User.create({ username, email, password })

    logger.info(`New user signed up: ${user.username} (${user._id})`)

    // toJSON in the model removes the password from this response
    res.status(201).send({
        status: true,
        message: "User created successfully",
        user: user
    })
}


// LOGIN with username + password OR email + password
// POST http://localhost:8081/api/v1/user/login
const login = async (req, res) => {
    const { username, email, password } = req.body

    // Search by whichever one was sent
    const filter = username ? { username: username } : { email: email }

    // The password has select: false in the model, so we ask for it here
    const user = await User.findOne(filter).select("+password")

    // Same message for "no such user" and "wrong password"
    // so an attacker cannot use login to find out which usernames exist
    if(!user || !(await user.comparePassword(password))){
        logger.warn(`Failed login attempt for ${username ? "username" : "email"}: ${username || email}`)
        return res.status(401).send({
            status: false,
            message: "Invalid username/email or password"
        })
    }

    const token = generateToken(user)

    logger.info(`User logged in: ${user.username} (${user._id})`)

    res.status(200).send({
        status: true,
        message: "Login successful",
        token: token,
        token_type: "Bearer",
        expires_in: process.env.JWT_EXPIRES_IN || "1h",
        user: user
    })
}

module.exports = { signup, login }
