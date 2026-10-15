/*
Purpose:
User routes, mounted at /api/v1/user in server.js
Each route runs in order: validation rules -> validate -> controller
*/

const express = require("express")
const router = express.Router()

const { signup, login } = require("../controllers/userController.js")
const { signupRules, loginRules } = require("../validators/userValidator.js")
const validate = require("../middleware/validate.js")


// POST http://localhost:8081/api/v1/user/signup
router.post("/signup", signupRules, validate, signup)

// POST http://localhost:8081/api/v1/user/login
router.post("/login", loginRules, validate, login)


module.exports = router
