/*
Purpose:
Runs after the validation rules
If any rule failed, stop here and send 400 with a list of what is wrong
If everything passed, move on to the controller
*/

const { validationResult } = require("express-validator")
const logger = require("../utils/logger.js")

const validate = (req, res, next) => {
    const result = validationResult(req)

    // No errors, go to the controller
    if(result.isEmpty()){
        return next()
    }

    // Turn the errors into a simple { field, message } list
    const errors = result.array().map((err) => {
        // checkExact error: lists the unknown field names
        if(err.type === "unknown_fields"){
            return {
                field: err.fields.map((f) => f.path).join(", "),
                message: err.msg
            }
        }

        return {
            field: err.path || "body",
            message: err.msg
        }
    })

    // Only log field names, never the values (they could be passwords)
    // Set removes duplicates (one field can fail more than one rule)
    const fields = [...new Set(errors.map((e) => e.field))].join(", ")
    logger.warn(`Validation failed on ${req.method} ${req.originalUrl} - fields: ${fields}`)

    return res.status(400).send({
        status: false,
        message: "Validation failed",
        errors: errors
    })
}

module.exports = validate
