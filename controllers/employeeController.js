/*
Purpose:
Handles the employee routes (all protected by the auth middleware)
Ownership is enforced twice:
1. getOwnedEmployee() checks the owner and returns 404 / 403
2. Every DB query also filters by { user: req.user.id }
No try/catch: Express 5 sends any thrown error to the central error handler by itself
*/

const Employee = require("../models/EmployeeModel.js")
const { getOwnedEmployee } = require("../services/employeeService.js")
const AppError = require("../utils/AppError.js")
const logger = require("../utils/logger.js")


// READ all employees of the logged in user
// GET http://localhost:8081/api/v1/emp/employees
const getAllEmployees = async (req, res) => {
    // Only this user's employees, newest first
    const employees = await Employee.find({ user: req.user.id }).sort({ created_at: -1 })

    res.status(200).send({
        status: true,
        message: "Employees retrieved successfully",
        count: employees.length,
        employees: employees
    })
}


// CREATE a new employee for the logged in user
// POST http://localhost:8081/api/v1/emp/employees
const createEmployee = async (req, res) => {
    // Owner always comes from the token, never from the body
    const employee = await Employee.create({
        ...req.body,
        user: req.user.id
    })

    logger.info(`Employee created: ${employee._id} by user ${req.user.id}`)

    res.status(201).send({
        status: true,
        message: "Employee created successfully",
        employee: employee
    })
}


// READ one employee by id
// GET http://localhost:8081/api/v1/emp/employees/:eid
const getEmployeeById = async (req, res) => {
    const employee = await getOwnedEmployee(req.params.eid, req.user.id)

    res.status(200).send({
        status: true,
        message: "Employee retrieved successfully",
        employee: employee
    })
}


// UPDATE one employee by id
// PUT http://localhost:8081/api/v1/emp/employees/:eid
const updateEmployee = async (req, res) => {
    // 404 / 403 check first
    await getOwnedEmployee(req.params.eid, req.user.id)

    // The filter has the owner too, so this can never touch another user's employee
    // returnDocument: "after" -> send back the updated version (Mongoose 9, replaces new: true)
    // runValidators           -> apply the schema rules on update too
    const updatedEmployee = await Employee.findOneAndUpdate(
        { _id: req.params.eid, user: req.user.id },
        req.body,
        { returnDocument: "after", runValidators: true }
    )

    // Could happen if it was deleted between the check and the update
    if(!updatedEmployee){
        throw new AppError(404, "Employee not found")
    }

    logger.info(`Employee updated: ${updatedEmployee._id} by user ${req.user.id}`)

    res.status(200).send({
        status: true,
        message: "Employee updated successfully",
        employee: updatedEmployee
    })
}


// DELETE one employee by id (id comes from the query string)
// DELETE http://localhost:8081/api/v1/emp/employees?eid=xxx
const deleteEmployee = async (req, res) => {
    const eid = req.query.eid

    // 404 / 403 check first
    await getOwnedEmployee(eid, req.user.id)

    // The filter has the owner too, so this can never delete another user's employee
    await Employee.deleteOne({ _id: eid, user: req.user.id })

    logger.info(`Employee deleted: ${eid} by user ${req.user.id}`)

    // 204 = success with no body
    res.status(204).send()
}


module.exports = {
    getAllEmployees,
    createEmployee,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
}
