/*
Purpose:
Employee model
Every employee belongs to the user who created it (the "user" field)
*/

const mongoose = require("mongoose")

const EmployeeSchema = new mongoose.Schema({
    first_name: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name must be at most 50 characters"]
    },
    last_name: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
        maxlength: [50, "Last name must be at most 50 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        trim: true,
        lowercase: true,
        maxlength: [100, "Email must be at most 100 characters"],
        match: [/^\S+@\S+\.\S+$/, "Email format is invalid"]
    },
    position: {
        type: String,
        required: [true, "Position is required"],
        trim: true,
        maxlength: [100, "Position must be at most 100 characters"]
    },
    salary: {
        type: Number,
        required: [true, "Salary is required"],
        validate: {
            validator: (value) => value > 0,
            message: "Salary must be a positive number"
        }
    },
    date_of_joining: {
        type: Date,
        required: [true, "Date of joining is required"]
    },
    department: {
        type: String,
        required: [true, "Department is required"],
        trim: true,
        maxlength: [100, "Department must be at most 100 characters"]
    },
    // Owner of this employee, points to a document in the users collection
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Employee must have an owner"],
        validate: {
            // Make sure the owner is a real user in the DB
            validator: async (userId) => {
                const exists = await mongoose.model("User").exists({ _id: userId })
                return exists !== null
            },
            message: "Owner must be an existing user"
        }
    }
}, {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
})


// One user cannot add the same employee email twice
// Two different users can still each have an employee with the same email
// This index also makes "find all employees of this user" fast
EmployeeSchema.index({ user: 1, email: 1 }, { unique: true })


// Remove __v from responses
EmployeeSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.__v
        return ret
    }
})

module.exports = mongoose.model("Employee", EmployeeSchema)
