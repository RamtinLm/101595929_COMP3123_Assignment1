/*
Purpose:
Ownership check for a single employee
404 if the employee does not exist, 403 if it belongs to another user
Used by GET by id, PUT and DELETE so the rule lives in one place
*/

const Employee = require("../models/EmployeeModel.js")
const AppError = require("../utils/AppError.js")
const logger = require("../utils/logger.js")


const getOwnedEmployee = async (eid, userId) => {
    const employee = await Employee.findById(eid)

    if(!employee){
        throw new AppError(404, "Employee not found")
    }

    // The owner saved in the DB must match the user from the token
    if(employee.user.toString() !== userId){
        logger.warn(`Authorization failed: user ${userId} tried to access employee ${eid} owned by another user`)
        throw new AppError(403, "You do not have permission to access this employee")
    }

    return employee
}

module.exports = { getOwnedEmployee }
