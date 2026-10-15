require("dotenv").config({ quiet: true })

// Fix for MongoDB Atlas SRV lookup on some networks (local only)
if(!process.env.VERCEL){
    require("dns").setServers(["8.8.8.8", "1.1.1.1"])
}

const express = require("express")
const mongoose = require("mongoose")
const connectDB = require("./config/db.js")
const logger = require("./utils/logger.js")
const requestLogger = require("./middleware/requestLogger.js")

const PORT = process.env.PORT || 8081

const app = express()

// Middleware
// Request logger goes first so even bad requests (broken JSON) get logged
app.use(requestLogger)
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse form bodies


// Root route
// GET http://localhost:8081/
app.get("/", (req, res) => {
    res.send("<h2>COMP3123 Assignment 1 - Employee Management API</h2>")
})


// Health check
// GET http://localhost:8081/health
app.get("/health", async (req, res) => {
    const dbStates = ["disconnected", "connected", "connecting", "disconnecting"]

    // Try to connect so the health check shows the real DB state
    try{
        await connectDB()
    } catch(err){
        logger.error("Health check could not reach the DB: " + err.message)
    }

    res.status(200).send({
        status: "ok",
        message: "API is running",
        uptime: Math.round(process.uptime()) + "s",
        timestamp: new Date().toISOString(),
        database: dbStates[mongoose.connection.readyState]
    })
})


// Every route below this line needs the DB
// Express 5 sends errors from async middleware to the error handler by itself
app.use(async (req, res, next) => {
    await connectDB()
    next()
})


// Routes go here (step 5 and 6)


// Vercel runs the app itself, so only listen when running locally
if(!process.env.VERCEL){
    app.listen(PORT, () => {
        logger.info(`Server listening on port ${PORT}`)
    })
} else {
    logger.info("App loaded on Vercel")
}

// Vercel needs the app exported (CommonJS)
module.exports = app
