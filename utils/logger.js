/*
Purpose:
Simple local logger
Writes every log line to logs/app.log and also prints it to the console
Never pass passwords, tokens or secrets into these functions
*/

const fs = require("fs")
const path = require("path")

// Vercel only allows writing to /tmp, locally we use the project logs folder
const LOG_DIR = process.env.VERCEL
    ? path.join("/tmp", "logs")
    : path.join(__dirname, "..", "logs")

const LOG_FILE = path.join(LOG_DIR, "app.log")

// Make sure the logs folder exists before writing
fs.mkdirSync(LOG_DIR, { recursive: true })


// Build one line and append it to the log file
const writeLog = (level, message) => {
    const line = `[${new Date().toISOString()}] [${level}] ${message}`

    console.log(line)

    fs.appendFile(LOG_FILE, line + "\n", (err) => {
        if(err){
            console.log("Could not write to log file:", err.message)
        }
    })
}


const info = (message) => writeLog("INFO", message)
const warn = (message) => writeLog("WARN", message)
const error = (message) => writeLog("ERROR", message)

module.exports = { info, warn, error }