// user-service/src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
//const Consul = require('consul');
const axios = require('axios');
//const {eventBus, discoveryClient, authenticateToken, buildLogger,requestLogger} = require('../../shared-lib');
const {eventBus, discoveryClient, authenticateToken, buildLogger,requestLogger} = require('@tqnhu4/shared-lib');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret_key";
//require('dotenv').config({
//  path: '../.env'
//});
//const consul = new Consul({ host: 'consul', port: '8500' });

const logger = buildLogger("user-service");
app.use(requestLogger(logger));
// PostgreSQL config
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'userdb',
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    //ssl: {
    //    rejectUnauthorized: false,
    //},
};

const pool = new Pool(dbConfig);

// ------------------------
// DATABASE INIT
// ------------------------
const connectDb = async () => {
    try {
        await pool.connect();
        console.log("Connected to PostgreSQL for User Service");

        const createTableQuery = `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE TABLE IF NOT EXISTS users (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                username VARCHAR(100) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log("Users table checked/created.");
    } catch (err) {
        console.error("User DB Init failed:", err);
        process.exit(1);
    }
};

app.use(bodyParser.json());

app.use(cors({
    origin: '*', 
    methods: ['GET','POST','PUT','DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));


// SWAGGER
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");

app.use("/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));



// Xuất JSON (openapi.json)
app.get('/openapi.json', (req, res) => {
    res.json(swaggerSpec);
});


// ------------------------
// API: Register
// ------------------------
/**
 * @openapi
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account. `username` and `password` are required.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 example: "secret123"
 *               email:
 *                 type: string
 *                 example: "john@example.com"
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User registered successfully."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *       400:
 *         description: Bad request (e.g., missing username/password or username exists)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Username already exists."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */
app.post("/register", async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password)
        return res.status(400).json({ message: "username and password required." });

    try {
        const checkUser = await pool.query(
            "SELECT id FROM users WHERE username = $1",
            [username]
        );

        if (checkUser.rowCount > 0) {
            return res.status(400).json({ message: "Username already exists." });
        }

        const result = await pool.query(
            `INSERT INTO users (username, password, email)
             VALUES ($1, $2, $3) RETURNING id, username, email, created_at`,
            [username, password, email]
        );

        eventBus.publish("UserCreated", result.rows[0]);

        res.status(201).json({
            message: "User registered successfully.",
            user: result.rows[0]
        });

    } catch (err) {
        console.error("Registration error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: Login (returns JWT)
// ------------------------

/**
 * @openapi
 * /users/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: "john_doe"
 *               password:
 *                 type: string
 *                 example: "mypassword123"
 *     responses:
 *       200:
 *         description: Login successful, returns JWT token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Login successful"
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *       401:
 *         description: Incorrect password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Incorrect password."
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */

app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const result = await pool.query(
            "SELECT id, username, password FROM users WHERE username = $1",
            [username]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ message: "User not found." });

        const user = result.rows[0];

        if (user.password !== password)
            return res.status(401).json({ message: "Incorrect password." });

        const token = jwt.sign(
            { id: user.id, username: user.username },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ message: "Login successful", token });

    } catch (err) {
        console.error("Login error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: /me (get user info from JWT)
// ------------------------

/**
 * @openapi
 * /users/me:
 *   get:
 *     summary: Get current authenticated user
 *     description: Returns information about the currently authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: [] 
 *     responses:
 *       200:
 *         description: Successfully retrieved user information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */

app.get("/me", authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            [req.user.id]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ message: "User not found." });

        //console.log(eventBus);
        eventBus.publish("user.created", result.rows[0]);        

        res.json({ user: result.rows[0] });

        logger.info({
            message: "Get user profile",
            traceId: req.traceId,
            userId: result.rows[0].id
        });        
    } catch (err) {
        console.error("/me error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: Get all users
// ------------------------
/**
 * @openapi
 * /users/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users.
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       username:
 *                         type: string
 *                         example: "john_doe"
 *                       email:
 *                         type: string
 *                         example: "john@example.com"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-26T10:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */

app.get("/users", async (req, res) => {
    try {
        const result = await pool.query(
            "SELECT id, username, email, created_at FROM users ORDER BY created_at DESC"
        );
        res.json({ users: result.rows });
    } catch (err) {
        console.error("Fetch users error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: Get user by ID
// ------------------------
/**
 * @openapi
 * /users/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     description: Retrieve a single user by their ID.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the user to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "john_doe"
 *                     email:
 *                       type: string
 *                       example: "john@example.com"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */
app.get("/users/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const result = await pool.query(
            "SELECT id, username, email, created_at FROM users WHERE id = $1",
            [userId]
        );

        if (result.rowCount === 0)
            return res.status(404).json({ message: "User not found." });

        res.json({ user: result.rows[0] });
    } catch (err) {
        console.error("Fetch user error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: Update user
// ------------------------
/**
 * @openapi
 * /users/users/{id}:
 *   put:
 *     summary: Update a user
 *     description: Update a user's information. Users can only update their own account. Authentication required.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 example: "new_username"
 *               email:
 *                 type: string
 *                 example: "new_email@example.com"
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated."
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     username:
 *                       type: string
 *                       example: "new_username"
 *                     email:
 *                       type: string
 *                       example: "new_email@example.com"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *       403:
 *         description: Forbidden, user tries to update another account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot update another user."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */
app.put("/users/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;

    if (req.user.id !== userId)
        return res.status(403).json({ message: "Cannot update another user." });

    const { username, email } = req.body;

    try {
        const result = await pool.query(
            `UPDATE users
             SET username = COALESCE($1, username),
                 email = COALESCE($2, email)
             WHERE id = $3
             RETURNING id, username, email, created_at`,
            [username, email, userId]
        );

        res.json({ message: "User updated.", user: result.rows[0] });

    } catch (err) {
        console.error("User update error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// API: Delete user
// ------------------------
/**
 * @openapi
 * /users/users/{id}:
 *   delete:
 *     summary: Delete a user
 *     description: Delete a user account. Users can only delete their own account. Authentication required.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User deleted."
 *       403:
 *         description: Forbidden, user tries to delete another account
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Cannot delete another user."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error."
 */
app.delete("/users/:id", authenticateToken, async (req, res) => {
    const userId = req.params.id;

    if (req.user.id !== userId)
        return res.status(403).json({ message: "Cannot delete another user." });

    try {
        await pool.query("DELETE FROM users WHERE id = $1", [userId]);
        res.json({ message: "User deleted." });
    } catch (err) {
        console.error("Delete user error:", err);
        res.status(500).json({ message: "Internal server error." });
    }
});

// ------------------------
// Health check
// ------------------------

/**
 * @openapi
 * /health:
 *   get:
 *     tags:
 *       - Users
 *     summary: Get healthy status
 *     responses:
 *       200:
 *         description: Healthy Status
 */

app.get('/health', (req, res) => {
    res.status(200).send("User service healthy");
});

// ------------------------
// START SERVER + CONSUL REGISTER
// ------------------------
connectDb().then(() => {
    app.listen(PORT, async () => {
        console.log(`User Service running on port ${PORT}`);

        try {
            await discoveryClient.register('user-service', 'user-service-instance-1', 'user-service', Number(PORT));
            console.log('Service registered successfully');
            //logger.info("Post service running");
        } catch (err) {
            console.error('Failed to register service:', err);
            console.error("Status:", err.response?.statusCode);
            console.error("Headers:", err.response?.headers);
            console.error("Body:", err.response?.body?.toString());            
        }
    });
});