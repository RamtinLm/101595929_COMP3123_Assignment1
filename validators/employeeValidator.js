/*
Purpose:
Validation rules for the employee routes
Create: every field is required
Update: every field is optional, but at least one must be sent
checkExact rejects unknown fields, so nobody can sneak in a "user" field to change the owner
*/

const { body, param, query, checkExact } = require("express-validator")


// Required on create, optional on update
const field = (name, label, isUpdate) => {
    const chain = body(name)

    return isUpdate
        ? chain.optional()
        : chain.exists().withMessage(`${label} is required`).bail()
}


// Shared rules for simple text fields
const textField = (name, label, max, isUpdate) => {
    return field(name, label, isUpdate)
        .isString().withMessage(`${label} must be text`).bail()
        .trim()
        .isLength({ min: 1, max: max }).withMessage(`${label} must be 1 to ${max} characters`)
}


// All employee body fields
const employeeRules = (isUpdate) => [
    textField("first_name", "First name", 50, isUpdate),
    textField("last_name", "Last name", 50, isUpdate),

    field("email", "Email", isUpdate)
        .isString().withMessage("Email must be text").bail()
        .trim()
        .isLength({ max: 100 }).withMessage("Email must be at most 100 characters")
        .isEmail().withMessage("Email format is invalid")
        .toLowerCase(),

    textField("position", "Position", 100, isUpdate),

    field("salary", "Salary", isUpdate)
        .isFloat({ gt: 0, max: 100000000 }).withMessage("Salary must be a positive number")
        .toFloat(),

    field("date_of_joining", "Date of joining", isUpdate)
        // strict: rejects dates that do not exist, like 2026-02-30
        .isISO8601({ strict: true, strictSeparator: true }).withMessage("Date of joining must be a valid date (YYYY-MM-DD)")
        .toDate(),

    textField("department", "Department", 100, isUpdate)
]


// :eid in the URL must be a valid MongoDB ObjectId (24 hex characters)
const eidParam = param("eid")
    .isMongoId().withMessage("Employee ID must be a valid MongoDB ObjectId")

// ?eid= in the query string (used by DELETE)
const eidQuery = query("eid")
    .exists().withMessage("eid query parameter is required").bail()
    .isMongoId().withMessage("Employee ID must be a valid MongoDB ObjectId")

// An update with an empty body does nothing, so reject it
// Outside checkExact on purpose, a whole-body rule inside it would allow any field
const atLeastOneField = body().custom((value) => {
    if(!value || Object.keys(value).length === 0){
        throw new Error("Send at least one field to update")
    }
    return true
})


const exactMessage = { message: "Unknown fields are not allowed" }

// POST   /api/v1/emp/employees
const createEmployeeRules = checkExact(employeeRules(false), exactMessage)

// PUT    /api/v1/emp/employees/:eid
const updateEmployeeRules = [
    checkExact([eidParam, ...employeeRules(true)], exactMessage),
    atLeastOneField
]

// GET    /api/v1/emp/employees/:eid
const employeeIdRules = checkExact([eidParam], exactMessage)

// DELETE /api/v1/emp/employees?eid=xxx
const deleteEmployeeRules = checkExact([eidQuery], exactMessage)

module.exports = {
    createEmployeeRules,
    updateEmployeeRules,
    employeeIdRules,
    deleteEmployeeRules
}
