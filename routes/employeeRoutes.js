/*
Purpose:
Employee routes, mounted at /api/v1/emp in server.js
Every route here needs a valid JWT (router.use(authenticate) runs first)
Each route runs in order: authenticate -> validation rules -> validate -> controller
*/

const express = require("express")
const router = express.Router()

const authenticate = require("../middleware/auth.js")
const validate = require("../middleware/validate.js")
const {
    createEmployeeRules,
    updateEmployeeRules,
    employeeIdRules,
    deleteEmployeeRules
} = require("../validators/employeeValidator.js")
const {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require("../controllers/employeeController.js")


// Protect every route below this line
router.use(authenticate)


// GET http://localhost:8081/api/v1/emp/employees
router.get("/employees", getAllEmployees)

// POST http://localhost:8081/api/v1/emp/employees
router.post("/employees", createEmployeeRules, validate, createEmployee)

// GET http://localhost:8081/api/v1/emp/employees/:eid
router.get("/employees/:eid", employeeIdRules, validate, getEmployeeById)

// PUT http://localhost:8081/api/v1/emp/employees/:eid
router.put("/employees/:eid", updateEmployeeRules, validate, updateEmployee)

// DELETE http://localhost:8081/api/v1/emp/employees?eid=xxx
router.delete("/employees", deleteEmployeeRules, validate, deleteEmployee)


module.exports = router
