/*
Purpose:
Connect to MongoDB once and reuse the same connection
Vercel can run the app many times, so we do not reconnect on every request
*/

const mongoose = require("mongoose")
const logger = require("../utils/logger.js")

const connectDB = async () => {
    // 1 = connected, so skip connecting again
    if(mongoose.connection.readyState === 1){
        return
    }

    // dbName forces the database name no matter what the URI says
    await mongoose.connect(process.env.MONGODB_URI, {
        dbName: "comp3123_assignment1"
    })

    logger.info("Successfully connected to the MongoDB Atlas server")
}

module.exports = connectDB