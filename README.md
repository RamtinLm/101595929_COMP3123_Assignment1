# COMP3123 Assignment 1 - Employee Management API

A secure REST API built with **Node.js, Express and MongoDB**.
Users sign up, log in with a JWT, and manage **only the employees they created**.

| | |
|---|---|
| **Student** | Ramtin Loghmani - 101595929 |
| **Course** | COMP 3123 Full Stack Development I - George Brown Polytechnic |
| **Live API** | https://101595929-comp-3123-assignment1.vercel.app |
| **Health check** | https://101595929-comp-3123-assignment1.vercel.app/health |
| **Database** | `comp3123_assignment1` (MongoDB Atlas) |

---

## Table of Contents
1. [Technologies](#technologies)
2. [Project Structure](#project-structure)
3. [Installation](#installation)
4. [Configuration](#configuration)
5. [API Endpoints](#api-endpoints)
6. [Authentication](#authentication)
7. [Authorization (Employee Ownership)](#authorization-employee-ownership)
8. [Security](#security)
9. [Error Handling and Status Codes](#error-handling-and-status-codes)
10. [Logging](#logging)
11. [Health Check](#health-check)
12. [Testing with Postman](#testing-with-postman)
13. [Sample Credentials](#sample-credentials)
14. [Deployment](#deployment)
15. [Decisions and Trade-offs](#decisions-and-trade-offs)

---

## Technologies

| Area | Tools |
|---|---|
| Runtime / framework | Node.js, Express 5 |
| Database | MongoDB Atlas, Mongoose 9 |
| Authentication | jsonwebtoken (JWT, HS256), bcryptjs (password hashing) |
| Validation | express-validator |
| Security | helmet, express-rate-limit |
| Config | dotenv |
| Testing | Postman (collection with automated tests) |
| Hosting | Vercel |

---

## Project Structure

```
101595929_COMP3123_Assignment1/
├── config/
│   └── db.js                   # MongoDB connection, reused between requests
├── controllers/
│   ├── employeeController.js   # Employee CRUD
│   └── userController.js       # Signup and login
├── logs/
│   ├── .gitkeep
│   └── sample.log              # Sample of real log output
├── middleware/
│   ├── auth.js                 # Verifies the JWT, sets req.user (401)
│   ├── errorHandler.js         # 404 for unknown routes + central error handler
│   ├── rateLimiter.js          # Login, signup and general API limits (429)
│   ├── requestLogger.js        # Logs every request
│   └── validate.js             # Sends validation errors (400)
├── models/
│   ├── EmployeeModel.js        # Employee schema, "user" field references User
│   └── UserModel.js            # User schema, password hashing
├── postman/
│   └── 101595929_COMP3123_Assignment1.postman_collection.json
├── routes/
│   ├── employeeRoutes.js       # /api/v1/emp (all protected)
│   └── userRoutes.js           # /api/v1/user
├── services/
│   ├── employeeService.js      # Ownership check (404 / 403)
│   └── tokenService.js         # Create and verify JWTs
├── utils/
│   ├── AppError.js             # Error with an HTTP status code
│   └── logger.js               # Writes logs to logs/app.log
├── validators/
│   ├── employeeValidator.js
│   └── userValidator.js
├── .env.example
├── .gitignore
├── package.json
└── server.js                   # Entry point, Express app (exported for Vercel)
```

### How a request moves through the app

```
Request
  -> requestLogger      (log method, path, status, time)
  -> helmet             (security headers)
  -> express.json       (parse body, max 10kb)
  -> apiLimiter         (general rate limit for /api)
  -> connectDB          (reuse the MongoDB connection)
  -> router
       user routes:      rate limiter -> validation rules -> validate -> controller
       employee routes:  authenticate -> validation rules -> validate -> controller -> service -> model
  -> response
Any error at any step -> errorHandler -> JSON error response
```

---

## Installation

**Requirements:** Node.js 18 or newer, and a MongoDB database (Atlas or local).

### 1. Clone the repository
```bash
git clone https://github.com/RamtinLm/101595929_COMP3123_Assignment1.git
cd 101595929_COMP3123_Assignment1
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure environment variables
```bash
cp .env.example .env
```
Then open `.env` and fill in the real values (see [Configuration](#configuration)).
To generate a strong `JWT_SECRET`:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Start MongoDB
- **MongoDB Atlas (what I used):** nothing to start. Put the Atlas connection string in `MONGODB_URI`, and allow your IP under *Network Access*.
- **Local MongoDB:** start it (for example `brew services start mongodb-community` on macOS) and use `MONGODB_URI=mongodb://127.0.0.1:27017`.

The app always uses the database `comp3123_assignment1`, whatever the URI says.

### 5. Start the application
```bash
npm run dev     # development, restarts on file changes (node --watch)
npm start       # normal start
```
The API runs at `http://localhost:8081`.

### 6. Test the API
- Open `http://localhost:8081/health`, it should show `"database": "connected"`
- Import the Postman collection and run it (see [Testing with Postman](#testing-with-postman))

---

## Configuration

All settings come from environment variables. The real `.env` file is **not** committed (it is in `.gitignore`). `.env.example` shows the keys with safe placeholder values.

| Variable | Required | Example | Purpose |
|---|---|---|---|
| `MONGODB_URI` | Yes | `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/` | Database connection string |
| `JWT_SECRET` | Yes | long random string | Signs and verifies JWTs |
| `PORT` | No | `8081` | Local server port |
| `JWT_EXPIRES_IN` | No | `1h` | How long a token is valid |
| `AUTH_RATE_LIMIT_MAX` | No | `10` | Max login (and signup) requests per IP per 15 minutes |
| `API_RATE_LIMIT_MAX` | No | `100` | Max API requests per IP per 15 minutes |

The server refuses to start if `MONGODB_URI` or `JWT_SECRET` is missing. Only the variable names are logged, never the values.

---

## API Endpoints

Base URLs: `/api/v1/user` and `/api/v1/emp`

| # | Method | Endpoint | Auth | Success | Purpose |
|---|---|---|---|---|---|
| 1 | POST | `/api/v1/user/signup` | No | **201** | Register a new user |
| 2 | POST | `/api/v1/user/login` | No | **200** | Log in, returns a JWT |
| 3 | GET | `/api/v1/emp/employees` | Yes | **200** | Get all employees of the logged in user |
| 4 | POST | `/api/v1/emp/employees` | Yes | **201** | Create an employee for the logged in user |
| 5 | GET | `/api/v1/emp/employees/{eid}` | Yes | **200** | Get one of your employees |
| 6 | PUT | `/api/v1/emp/employees/{eid}` | Yes | **200** | Update one of your employees |
| 7 | DELETE | `/api/v1/emp/employees?eid=xxx` | Yes | **204** | Delete one of your employees |
| - | GET | `/health` | No | **200** | Health check |

### Response format
Every response is JSON with the same shape:
```json
{ "status": true, "message": "Employee created successfully", "employee": { } }
```
```json
{ "status": false, "message": "Validation failed", "errors": [ { "field": "email", "message": "Email format is invalid" } ] }
```
(`DELETE` returns **204 No Content**, which has no body.)

### 1. Signup
`POST /api/v1/user/signup`
```json
{
    "username": "usera",
    "email": "usera@example.com",
    "password": "Test1234!"
}
```
**201 Created**
```json
{
    "status": true,
    "message": "User created successfully",
    "user": {
        "_id": "6ad133b5a7ad3ca8979b510c",
        "username": "usera",
        "email": "usera@example.com",
        "created_at": "2026-10-15T20:12:37.732Z",
        "updated_at": "2026-10-15T20:12:37.732Z"
    }
}
```
The password (hashed or not) is never returned.

| Field | Rules |
|---|---|
| `username` | required, text, 3 to 30 characters, letters / numbers / `_`, unique |
| `email` | required, valid email, max 100 characters, unique (stored in lowercase) |
| `password` | required, 8 to 64 characters, at least one lowercase, one uppercase and one number |

### 2. Login
`POST /api/v1/user/login` with **username + password** or **email + password**
```json
{ "username": "usera", "password": "Test1234!" }
```
```json
{ "email": "usera@example.com", "password": "Test1234!" }
```
**200 OK**
```json
{
    "status": true,
    "message": "Login successful",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "token_type": "Bearer",
    "expires_in": "1h",
    "user": { "_id": "...", "username": "usera", "email": "usera@example.com" }
}
```

### 3. Get all employees
`GET /api/v1/emp/employees`
Header: `Authorization: Bearer <token>`

**200 OK**
```json
{
    "status": true,
    "message": "Employees retrieved successfully",
    "count": 1,
    "employees": [
        {
            "_id": "6ad1396dc40c79b9237e5373",
            "first_name": "John",
            "last_name": "Smith",
            "email": "john.smith@example.com",
            "position": "Software Developer",
            "salary": 75000,
            "date_of_joining": "2026-01-15T00:00:00.000Z",
            "department": "Engineering",
            "user": "6ad133b5a7ad3ca8979b510c",
            "created_at": "2026-10-15T20:37:01.492Z",
            "updated_at": "2026-10-15T20:37:01.492Z"
        }
    ]
}
```

### 4. Create employee
`POST /api/v1/emp/employees`
```json
{
    "first_name": "John",
    "last_name": "Smith",
    "email": "john.smith@example.com",
    "position": "Software Developer",
    "salary": 75000,
    "date_of_joining": "2026-01-15",
    "department": "Engineering"
}
```
**201 Created** with the new employee. The `user` (owner) field is set by the server from the token. Sending a `user` field yourself is rejected with 400.

| Field | Rules |
|---|---|
| `first_name`, `last_name` | required, text, 1 to 50 characters |
| `email` | required, valid email, max 100 characters, unique per user |
| `position`, `department` | required, text, 1 to 100 characters |
| `salary` | required, number greater than 0 |
| `date_of_joining` | required, real date in `YYYY-MM-DD` format (`2026-02-30` is rejected) |
| any other field | rejected (`Unknown fields are not allowed`) |

### 5. Get employee by id
`GET /api/v1/emp/employees/{eid}` → **200 OK** with `employee`

### 6. Update employee
`PUT /api/v1/emp/employees/{eid}`. Send one or more fields to change:
```json
{ "position": "Senior Software Developer", "salary": 85000 }
```
**200 OK** with the updated `employee`. An empty body returns 400.

### 7. Delete employee
`DELETE /api/v1/emp/employees?eid={eid}` → **204 No Content**

---

## Authentication

1. **Signup:** the user is saved, and the password is hashed with bcrypt before it reaches the database.
2. **Login:** the server finds the user by username or email and compares the password with the stored hash. If they match, it creates a **JWT**.
3. **JWT:** signed with `JWT_SECRET` using **HS256**. The payload holds only `id`, `username`, `iat` (issued at) and `exp` (expires, 1 hour). The token is **signed, not encrypted**: anyone can read the payload, but nobody can change it without the secret, because the signature would no longer match.
4. **Authorization header:** every employee request must send
   ```
   Authorization: Bearer <token>
   ```
5. **Protected endpoints:** `router.use(authenticate)` protects every `/api/v1/emp` route. The `authenticate` middleware:
   - rejects a **missing** token → `401 Access denied, no token provided`
   - rejects an **invalid or edited** token → `401 Invalid token`
   - rejects an **expired** token → `401 Token has expired, please log in again`
   - rejects a token for a user that **no longer exists** → `401`
   - pins the algorithm to HS256, so the token header cannot switch it
   - sets `req.user = { id, username }` **from the verified token only**

Wrong login details always return the same message (`Invalid username/email or password`), so login cannot be used to find out which usernames exist.

---

## Authorization (Employee Ownership)

> A user can only see and manage the employees they created.

**Relationship:** every employee has a `user` field (`ObjectId`, `ref: "User"`, required) that stores the id of the user who created it. One user has many employees. The schema also checks that this id belongs to an existing user.

**How ownership is enforced (server side, never trusting the client):**

1. **The owner comes from the token.** On create, the controller sets `user: req.user.id`. The `user` field is not allowed in the request body (`checkExact` returns 400), so a client cannot assign an employee to someone else.
2. **The list is filtered by owner.** `GET /employees` runs `Employee.find({ user: req.user.id })`, so other users' employees are never returned.
3. **Single employee access is checked.** `services/employeeService.js` → `getOwnedEmployee(eid, userId)`:
   - employee does not exist → **404 Employee not found**
   - employee belongs to another user → **403 You do not have permission to access this employee** (and the attempt is logged)
4. **Every write query includes the owner too:** `findOneAndUpdate({ _id: eid, user: req.user.id })` and `deleteOne({ _id: eid, user: req.user.id })`. Even if the check in step 3 were skipped, these queries could never touch another user's document.

Because of this, changing `eid` in the URL or query string cannot bypass authorization. This is tested in the Postman folder **08 Ownership - Two User Test**: User A tries to get, update and delete User B's employee (403), then User B does the same to User A (403), and a final request confirms User B's employee was not changed.

---

## Security

### Password hashing
- **bcryptjs** with cost factor 10 (2^10 rounds, slow on purpose so guessing is expensive)
- A random **salt** per password, so two users with the same password get different hashes
- Hashing happens in a Mongoose `pre("save")` hook, and only when the password changed
- The password field has `select: false`, and `toJSON` removes it, so it is **never** returned in responses
- Max length is 64 characters because bcrypt only uses the first 72 bytes

### JWT
- HS256, signed with a long random `JWT_SECRET` from the environment
- Expires after 1 hour
- No secrets in the payload
- Algorithm pinned on verify

### Helmet
`app.use(helmet())` adds HTTP security headers that protect against common browser attacks:

| Header | Protects against |
|---|---|
| `Content-Security-Policy` | Cross-site scripting (XSS), loading scripts from other sites |
| `Strict-Transport-Security` | Downgrade to plain HTTP |
| `X-Content-Type-Options: nosniff` | Browser guessing (sniffing) the content type |
| `X-Frame-Options: SAMEORIGIN` | Clickjacking (page inside a hidden frame) |
| `Referrer-Policy: no-referrer` | Leaking URLs to other sites |
| `Cross-Origin-Opener-Policy` | Cross-window attacks |
| `X-Powered-By` **removed** | Revealing that the server runs Express |

### Rate limiting
**What it is:** a limit on how many requests one IP address can make in a time window. It slows down password guessing (brute force), spam signups and request floods.

**Which endpoints are protected:**

| Limiter | Applies to | Limit |
|---|---|---|
| `loginLimiter` | `POST /api/v1/user/login` | 10 requests / 15 minutes / IP |
| `signupLimiter` | `POST /api/v1/user/signup` | 10 requests / 15 minutes / IP |
| `apiLimiter` | everything under `/api` | 100 requests / 15 minutes / IP |

**When the limit is exceeded:** the API returns **429 Too Many Requests**:
```json
{ "status": false, "message": "Too many login attempts, please try again in 15 minutes" }
```
with these headers:
```
RateLimit-Policy: "10-in-15min"; q=10; w=900
RateLimit: "10-in-15min"; r=0; t=890
Retry-After: 890
```
The event is also logged: `[WARN] Rate limit hit: POST /api/v1/user/login from ip ...`

**Test result:** sending `POST /api/v1/user/login` repeatedly from the same IP returned 200 / 401 for the first 10 requests and **429** from the 11th request on, until the 15-minute window reset (screenshot in the submission document).

### Input validation
- **express-validator** checks every field before the controller runs: required fields, types, lengths, email format, positive salary, real dates, valid MongoDB ObjectIds
- `isString()` blocks NoSQL injection objects such as `{ "$gt": "" }`
- `checkExact` rejects unknown fields (stops mass assignment, for example sending `user` or `role`)
- Sanitizing: `trim`, lowercase emails, convert salary to a number and dates to `Date`
- Mongoose schema rules are a second layer
- JSON bodies are limited to 10kb

### Environment variables
- Secrets (`MONGODB_URI`, `JWT_SECRET`) only live in `.env` locally and in Vercel's environment settings
- `.env` is in `.gitignore` and was never committed, and `.env.example` has placeholders only
- The MongoDB user for this app only has `readWrite` on `comp3123_assignment1`

---

## Error Handling and Status Codes

All errors go through **one central error handler** (`middleware/errorHandler.js`) and come back as JSON with `status: false`. Unexpected errors return a generic message. The real details go to the log only, never stack traces or secrets.

| Code | When | Example |
|---|---|---|
| **200** OK | Successful login, GET, PUT | Login, get employees |
| **201** Created | A new resource was created | Signup, create employee |
| **204** No Content | Deleted, nothing to return | Delete employee |
| **400** Bad Request | The request itself is wrong | Validation failed, malformed JSON, invalid ObjectId, unknown field, empty update |
| **401** Unauthorized | Not authenticated | Missing / invalid / expired token, wrong login details |
| **403** Forbidden | Authenticated, but not allowed | Accessing another user's employee |
| **404** Not Found | It does not exist | Employee not found, unknown route |
| **409** Conflict | Clashes with existing data | Username or email already exists, same employee email twice for one user |
| **413** Payload Too Large | Body over 10kb | Very large JSON body |
| **429** Too Many Requests | Rate limit reached | 11th login in 15 minutes |
| **500** Internal Server Error | Unexpected or database error | Database unreachable (`"Internal server error"`) |

---

## Logging

**Where:** `logs/app.log` locally (on Vercel `/tmp/logs/app.log`, plus the Vercel dashboard logs). Every line is also printed to the console.
`logs/*.log` is git-ignored, so `logs/sample.log` is included as a sample of real output.

**Format:**
```
[2026-10-15T20:37:01.198Z] [INFO] User logged in: usera (6ad1396cc40c79b9237e5371)
[2026-10-15T20:37:01.433Z] [WARN] Failed login attempt for username: usera
[2026-10-15T20:37:01.563Z] [WARN] Validation failed on POST /api/v1/emp/employees - fields: email
[2026-10-15T20:37:01.700Z] [WARN] Authorization failed: user 6ad13... tried to access employee 6ad13... owned by another user
[2026-10-15T20:37:01.701Z] [WARN] GET /api/v1/emp/employees/6ad13... 403 - 5ms - ip 127.0.0.1
```

**What is logged:**
- Server startup and database connection
- Every request: timestamp, method, path, status code, duration, IP (INFO for 2xx/3xx, WARN for 4xx, ERROR for 5xx)
- Authentication: successful logins, failed logins, missing / invalid / expired tokens
- Validation failures (field names only)
- Authorization failures (403 ownership attempts)
- Successful operations: signup, employee created / updated / deleted
- Rate limit hits, duplicate keys, malformed JSON
- Application errors (500) with the error name and message

**What is intentionally NOT logged:**
- Passwords (request bodies are never logged, validation logs only field names)
- JWTs or the `Authorization` header
- `JWT_SECRET`, `MONGODB_URI` or any database credentials (the env check logs only variable names)

---

## Health Check

**URL:** `GET /health` (no authentication, not rate limited)
- Local: http://localhost:8081/health
- Live: https://101595929-comp-3123-assignment1.vercel.app/health

**Expected response (200 OK):**
```json
{
    "status": "ok",
    "message": "API is running",
    "uptime": "39s",
    "timestamp": "2026-10-15T22:13:22.660Z",
    "database": "connected"
}
```
`database` shows the real MongoDB state: `connected`, `connecting`, `disconnecting` or `disconnected`. The endpoint still returns 200 when the database is down, so you can tell "server running, database down" apart from "server down".

---

## Testing with Postman

The collection is in `postman/101595929_COMP3123_Assignment1.postman_collection.json`.
It has **47 requests in 9 folders** with **57 automated tests**. Tokens and employee ids are saved automatically into collection variables, so nothing has to be copied by hand.

| Folder | What it tests |
|---|---|
| 01 Health Check | Server and DB status, Helmet headers |
| 02 Signup | Valid signups (User A, User B), duplicate username / email (409), invalid email, invalid password, missing fields, malformed JSON (400) |
| 03 Login | Username + password, email + password (200), invalid credentials (401), missing credentials (400) |
| 04 Create Employee | Valid (201), missing fields, invalid email / salary / date (400), duplicate (409), missing / invalid / expired JWT (401) |
| 05 Read Employees | Each user sees only their own list, get by id (200), non-existing (404), invalid id (400), missing JWT (401) |
| 06 Update Employee | Update own (200), try to change owner (400), empty body (400), non-existing (404) |
| 07 Delete Employee | Delete own (204), already deleted (404), invalid id / missing eid (400) |
| 08 Ownership - Two User Test | User A vs User B employees and the reverse: get / update / delete (403), then proof nothing changed |
| 09 Errors and Rate Limit | Unsupported route (404), login rate limit (429) |

**How to run it:**
1. Import the collection into Postman.
2. Set the `baseUrl` collection variable: `http://localhost:8081` or the live URL.
3. For the expired-token test, create an already expired token with your secret and paste it into the `expiredToken` variable:
   ```bash
   node -e 'require("dotenv").config({quiet:true});console.log(require("jsonwebtoken").sign({id:"000000000000000000000000",username:"expired"},process.env.JWT_SECRET,{expiresIn:-60}))'
   ```
4. Start with a fresh database (the "valid signup" requests expect `usera` and `userb` not to exist yet, otherwise they correctly return 409).
5. Run the folders **in order**, or use **Run collection** for all of them at once.
6. For the 429 test, send the last request repeatedly until it returns 429. Restarting the server resets the counters.

**Result:** 47 requests, 57 tests, 0 failures (Collection Runner screenshot in the submission document).

---

## Sample Credentials

Non-sensitive test accounts for marking:

| User | Username | Email | Password |
|---|---|---|---|
| User A | `usera` | `usera@example.com` | `Test1234!` |
| User B | `userb` | `userb@example.com` | `Test1234!` |

---

## Deployment

The API is deployed on **Vercel**: https://101595929-comp-3123-assignment1.vercel.app

- Vercel detects the Express app from `server.js`, which exports the app (`module.exports = app`). `app.listen()` only runs locally.
- Environment variables (`MONGODB_URI`, `JWT_SECRET`, `JWT_EXPIRES_IN`) are set in the Vercel project settings, not in the code.
- The MongoDB connection is reused between requests, because a serverless function can run many times.
- `trust proxy` is enabled on Vercel, so the rate limiter sees the real client IP instead of Vercel's proxy.
- Every push to `main` deploys to production.

---

## Decisions and Trade-offs

**Detailed comments.** I know heavy commenting is not standard in production code, where comments should explain *why* rather than *what* and can go out of date. I chose to keep them because they are my own study notes for this course, and they also explain my reasoning to anyone reviewing the code.

**403 instead of 404 for other users' employees.** Some APIs return 404 so they don't reveal that an id exists. I return 403 because it makes the ownership rule clear and the assignment asks to demonstrate it. Employee ids are random ObjectIds, so guessing them is not practical.

**Atlas network access 0.0.0.0/0.** Not ideal, but Vercel's IP addresses change, so a fixed allowlist isn't possible on the free tier. The database still needs a username and password, and that user only has `readWrite` on this one database.

**Rate limit counters are stored in memory.** This is simple and fine for one server. On Vercel, each running instance keeps its own counter, so the limit is per instance. A production app would use a shared store such as Redis.

**Logs on Vercel go to `/tmp`.** Vercel's filesystem is read-only except `/tmp`, which gets cleared. Full logs are kept locally in `logs/`, and Vercel keeps the console output in its dashboard.

**bcryptjs instead of bcrypt.** bcryptjs is pure JavaScript, so it does not need native compiling, which can fail on serverless platforms. It is slower than native bcrypt, which is acceptable here.

**Same database for local and deployed.** Both use `comp3123_assignment1` on Atlas, as the assignment requires this exact database name. A real project would use separate development and production databases.
