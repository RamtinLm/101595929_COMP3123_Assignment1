/*
Purpose:
Validation rules for the user routes (signup and login)
These run BEFORE the controller, so bad input never reaches the database
*/

const { body, checkExact } = require("express-validator")


// POST /api/v1/user/signup
const signupRules = checkExact([
    body("username")
        .exists().withMessage("Username is required").bail()
        .isString().withMessage("Username must be text").bail() // blocks objects like { "$gt": "" }
        .trim()
        .isLength({ min: 3, max: 30 }).withMessage("Username must be 3 to 30 characters")
        .matches(/^[a-zA-Z0-9_]+$/).withMessage("Username can only contain letters, numbers and _"),

    body("email")
        .exists().withMessage("Email is required").bail()
        .isString().withMessage("Email must be text").bail()
        .trim()
        .isLength({ max: 100 }).withMessage("Email must be at most 100 characters")
        .isEmail().withMessage("Email format is invalid")
        .toLowerCase(),

    body("password")
        .exists().withMessage("Password is required").bail()
        .isString().withMessage("Password must be text").bail()
        // max 64 because bcrypt only uses the first 72 bytes of a password
        .isLength({ min: 8, max: 64 }).withMessage("Password must be 8 to 64 characters")
        .matches(/[a-z]/).withMessage("Password must contain a lowercase letter")
        .matches(/[A-Z]/).withMessage("Password must contain an uppercase letter")
        .matches(/[0-9]/).withMessage("Password must contain a number")
], { message: "Unknown fields are not allowed" })


// Login needs username OR email, so this checks the whole body
// It sits outside checkExact on purpose, a whole-body rule inside it would allow any field
const usernameOrEmail = body().custom((value) => {
    if(!value || (value.username === undefined && value.email === undefined)){
        throw new Error("Username or email is required")
    }
    return true
})


// POST /api/v1/user/login
const loginRules = [
    checkExact([
        body("username")
            .optional()
            .isString().withMessage("Username must be text").bail()
            .trim()
            .notEmpty().withMessage("Username cannot be empty"),

        body("email")
            .optional()
            .isString().withMessage("Email must be text").bail()
            .trim()
            .isEmail().withMessage("Email format is invalid")
            .toLowerCase(),

        body("password")
            .exists().withMessage("Password is required").bail()
            .isString().withMessage("Password must be text").bail()
            .notEmpty().withMessage("Password is required")
    ], { message: "Unknown fields are not allowed" }),
    usernameOrEmail
]

module.exports = { signupRules, loginRules }
