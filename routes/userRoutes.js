/*
Purpose:
User routes, mounted at /api/v1/user in server.js
Each route runs in order: rate limiter -> validation rules -> validate -> controller
*/

const express = require("express")
const router = express.Router()

const { signup, login } = require("../controllers/userController.js")
const { signupRules, loginRules } = require("../validators/userValidator.js")
const validate = require("../middleware/validate.js")
const { signupLimiter, loginLimiter } = require("../middleware/rateLimiter.js")


// POST http://localhost:8081/api/v1/user/signup
router.post("/signup", signupLimiter, signupRules, validate, signup)

// POST http://localhost:8081/api/v1/user/login
router.post("/login", loginLimiter, loginRules, validate, login)


module.exports = router
