/*
Purpose:
User model
The password is hashed before saving and is never sent back in responses
*/

const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        required: [true, "Username is required"],
        unique: true,
        trim: true,
        minlength: [3, "Username must be at least 3 characters"],
        maxlength: [30, "Username must be at most 30 characters"]
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        maxlength: [100, "Email must be at most 100 characters"],
        match: [/^\S+@\S+\.\S+$/, "Email format is invalid"]
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [8, "Password must be at least 8 characters"],
        select: false // Not returned by queries unless we ask with .select("+password")
    }
}, {
    // Rename createdAt / updatedAt to match the assignment field names
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
})


// Hash the password before saving
// Mongoose 9: no next() anymore, an async function is enough
// Normal function (not arrow) so "this" is the user document
UserSchema.pre("save", async function(){
    // Only hash when the password is new or changed, otherwise we would hash the hash
    if(!this.isModified("password")){
        return
    }

    // 10 = cost factor, bcrypt runs 2^10 rounds (slow on purpose)
    this.password = await bcrypt.hash(this.password, 10)
})


// Compare a plain password with the stored hash (used in login)
UserSchema.methods.comparePassword = async function(plainPassword){
    return bcrypt.compare(plainPassword, this.password)
}


// Remove password and __v whenever a user is turned into JSON
UserSchema.set("toJSON", {
    transform: (doc, ret) => {
        delete ret.password
        delete ret.__v
        return ret
    }
})

module.exports = mongoose.model("User", UserSchema)
