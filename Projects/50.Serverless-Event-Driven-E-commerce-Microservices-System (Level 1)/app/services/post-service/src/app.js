// post-service/src/app.js
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
//const Consul = require('consul');
const axios = require('axios');
//const {eventBus} = require('../shared-lib');
//const {eventBus, discoveryClient, authenticateToken, buildLogger,requestLogger} = require('../../shared-lib');

const {eventBus, discoveryClient, authenticateToken, buildLogger,requestLogger} = require('@tqnhu4/shared-lib');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3003; // Port cho Post Service
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key'; // equal to User Service

const logger = buildLogger("post-service");
app.use(requestLogger(logger));

//const consul = new Consul({ host: 'consul', port: '8500' });

// Database configuration (PostgreSQL)
const dbConfig = {
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'postdb', 
    password: process.env.DB_PASSWORD || 'password',
    port: process.env.DB_PORT || 5432,
    //ssl: {
    //    rejectUnauthorized: false,
    //},

};

const pool = new Pool(dbConfig);

// --- Database Initialization ---

const connectDb = async () => {
    try {
        await pool.connect();
        console.log('Connected to PostgreSQL database for Post Service');

        // Create posts table if it doesnt exited
        const createTableQuery = `
            CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
            CREATE TABLE IF NOT EXISTS posts (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL,
                title VARCHAR(255) NOT NULL,
                content TEXT,
                image_url VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `;
        await pool.query(createTableQuery);
        console.log('Posts table checked/created successfully.');
    } catch (err) {
        console.error('Database connection or table creation failed:', err);
        process.exit(1);
    }
};

app.use(bodyParser.json());

//app.use(cors());
app.use(cors({
    origin: '*',                  // hoặc origin: ['http://localhost:8080']
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

// -----------------------
// Subscribe to events HERE
// -----------------------

eventBus.start();

eventBus.subscribe("user.created", async (user) => {
    console.log("[PostService] Received UserCreated event:", user);
    // Optional: auto-create a post or timeline
    const userId = user.id;
    const title = 'My first post';
    const content = 'This is the content of my first post.';
    const image_url = 'https://example.com/image.jpg';

    const result = await pool.query(
        `INSERT INTO posts (user_id, title, content, image_url)
            VALUES ($1, $2, $3, $4) RETURNING id, user_id, title, content, image_url, created_at`,
        [userId, title, content, image_url]
    );
});


// --- API Endpoints ---

/**
 * @api {post} /posts Create a new post (Authenticated User)
 */
/**
 * @openapi
 * /posts/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post. Authentication required. `title` is mandatory.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 example: "My first post"
 *               content:
 *                 type: string
 *                 example: "This is the content of my first post."
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/image.jpg"
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post created successfully."
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "My first post"
 *                     content:
 *                       type: string
 *                       example: "This is the content of my first post."
 *                     image_url:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *       400:
 *         description: Bad request (e.g., missing title)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post title is required."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error during post creation."
 */
app.post('/posts', authenticateToken, async (req, res) => {
    const { title, content, image_url } = req.body;
    const userId = req.user.id;

    if (!title) {
        return res.status(400).json({ message: 'Post title is required.' });
    }

    try {
        const result = await pool.query(
            `INSERT INTO posts (user_id, title, content, image_url)
             VALUES ($1, $2, $3, $4)
             RETURNING id, user_id, title, content, image_url, created_at`,
            [userId, title, content, image_url]
        );
        const newPost = result.rows[0];
        console.log(`Post created by user ${userId}: ${newPost.title}`);
        res.status(201).json({ message: 'Post created successfully.', post: newPost });
    } catch (err) {
        console.error('Error creating post:', err);
        res.status(500).json({ message: 'Internal server error during post creation.' });
    }
});

/**
 * @api {get} /posts Get all posts
 */
/**
 * @openapi
 * /posts/posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve a list of all posts, ordered by ID descending.
 *     tags:
 *       - Posts
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       user_id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "My first post"
 *                       content:
 *                         type: string
 *                         example: "This is the content of the post."
 *                       image_url:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-26T10:00:00Z"
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-26T12:00:00Z"
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error fetching posts."
 */
app.get('/posts', async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, user_id, title, content, image_url, created_at, updated_at
             FROM posts ORDER BY id DESC`
        );
        res.json({ posts: result.rows });
    } catch (err) {
        console.error('Error fetching posts:', err);
        res.status(500).json({ message: 'Internal server error fetching posts.' });
    }
});

/**
 * @api {get} /posts/user/:userId Get posts by user ID
 */
/**
 * @openapi
 * /posts/posts/user/{userId}:
 *   get:
 *     summary: Get posts by user
 *     description: Retrieve a list of posts created by a specific user, ordered by ID descending.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       title:
 *                         type: string
 *                         example: "My first post"
 *                       content:
 *                         type: string
 *                         example: "This is the content of the post."
 *                       image_url:
 *                         type: string
 *                         example: "https://example.com/image.jpg"
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                         example: "2025-11-26T10:00:00Z"
 *       404:
 *         description: No posts found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No posts found for this user."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error fetching user posts."
 */
app.get('/posts/user/:userId', async (req, res) => {
    //const userId = parseInt(req.params.userId);
    const userId = req.params.userId;

    try {
        logger.info({
            message: "Get user's post",
            traceId: req.traceId
        });        

        const result = await pool.query(
            `SELECT id, title, content, image_url, created_at
             FROM posts WHERE user_id = $1 ORDER BY id DESC`,
            [userId]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ message: 'No posts found for this user.' });
        }

        //
        const data = {};
        /*
        const url = `http://user-service:3002/users/${userId}`;

        const userResult = await axios.get(url);

        
        console.log(userResult.data.user);

        data.user =  userResult?.data?.user ?? null;
        */
        data.posts =  result.rows;

        res.json(data);

        //

        //res.json({ posts: result.rows });
    } catch (err) {
        console.error('Error fetching user posts:', err);
        res.status(500).json({ message: 'Internal server error fetching user posts.' });
    }
});

/**
 * @api {get} /posts/:id Get post by ID
 */
/**
 * @openapi
 * /posts/posts/{id}:
 *   get:
 *     summary: Get post by ID
 *     description: Retrieve a single post by its ID.
 *     tags:
 *       - Posts
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the post
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "My first post"
 *                     content:
 *                       type: string
 *                       example: "This is the content of the post."
 *                     image_url:
 *                       type: string
 *                       example: "https://example.com/image.jpg"
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T10:00:00Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T12:00:00Z"
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error fetching post."
 */

app.get('/posts/:id', async (req, res) => {
    //const postId = parseInt(req.params.id);
    const postId = req.params.id;

    try {
        const result = await pool.query(
            `SELECT id, user_id, title, content, image_url, created_at, updated_at
             FROM posts WHERE id = $1`,
            [postId]
        );

        const post = result.rows[0];
        if (!post) return res.status(404).json({ message: 'Post not found.' });

        res.json({ post });
    } catch (err) {
        console.error('Error fetching post by ID:', err);
        res.status(500).json({ message: 'Internal server error fetching post.' });
    }
});

/**
 * @api {put} /posts/:id Update post by ID (Author Only)
 */
/**
 * @openapi
 * /posts/posts/{id}:
 *   put:
 *     summary: Update a post
 *     description: Update a post by ID. Only the owner of the post can update it.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the post to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Updated post title"
 *               content:
 *                 type: string
 *                 example: "Updated content of the post."
 *               image_url:
 *                 type: string
 *                 example: "https://example.com/new-image.jpg"
 *     responses:
 *       200:
 *         description: Post updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post updated successfully."
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     user_id:
 *                       type: integer
 *                       example: 1
 *                     title:
 *                       type: string
 *                       example: "Updated post title"
 *                     content:
 *                       type: string
 *                       example: "Updated content of the post."
 *                     image_url:
 *                       type: string
 *                       example: "https://example.com/new-image.jpg"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2025-11-26T12:00:00Z"
 *       403:
 *         description: "Forbidden: user is not the owner"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only update your own posts."
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error updating post."
 */

app.put('/posts/:id', authenticateToken, async (req, res) => {
    //const postId = parseInt(req.params.id);
    const postId = req.params.id;
    const userId = req.user.id;
    const { title, content, image_url } = req.body;

    try {
        // Check ownership
        const ownerCheck = await pool.query(`SELECT user_id FROM posts WHERE id = $1`, [postId]);
        if (ownerCheck.rowCount === 0)
            return res.status(404).json({ message: 'Post not found.' });
        if (ownerCheck.rows[0].user_id !== userId)
            return res.status(403).json({ message: 'Forbidden: You can only update your own posts.' });

        const result = await pool.query(
            `UPDATE posts
             SET title = COALESCE($1, title),
                 content = COALESCE($2, content),
                 image_url = COALESCE($3, image_url),
                 updated_at = NOW()
             WHERE id = $4
             RETURNING id, user_id, title, content, image_url, updated_at`,
            [title, content, image_url, postId]
        );

        res.json({ message: 'Post updated successfully.', post: result.rows[0] });
    } catch (err) {
        console.error('Error updating post:', err);
        res.status(500).json({ message: 'Internal server error updating post.' });
    }
});

/**
 * @api {delete} /posts/:id Delete post by ID (Author Only)
 */
/**
 * @openapi
 * /posts/posts/{id}:
 *   delete:
 *     summary: Delete a post
 *     description: Delete a post by ID. Only the owner of the post can delete it.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           example: 1
 *         description: ID of the post to delete
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post deleted successfully."
 *       403:
 *         description: "Forbidden: user is not the owner"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden: You can only delete your own posts."
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Post not found."
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Internal server error deleting post."
 */
app.delete('/posts/:id', authenticateToken, async (req, res) => {
    //const postId = parseInt(req.params.id);
    const postId = req.params.id;
    const userId = req.user.id;

    try {
        const ownerCheck = await pool.query(`SELECT user_id FROM posts WHERE id = $1`, [postId]);
        if (ownerCheck.rowCount === 0)
            return res.status(404).json({ message: 'Post not found.' });
        if (ownerCheck.rows[0].user_id !== userId)
            return res.status(403).json({ message: 'Forbidden: You can only delete your own posts.' });

        await pool.query('DELETE FROM posts WHERE id = $1', [postId]);
        res.json({ message: 'Post deleted successfully.' });
    } catch (err) {
        console.error('Error deleting post:', err);
        res.status(500).json({ message: 'Internal server error deleting post.' });
    }
});

// Health check endpoint
/**
 * @openapi
 * /posts/health:
 *   get:
 *     tags:
 *       - Posts
 *     summary: Check healthy status
 *     responses:
 *       200:
 *         description: Check healthy status
 */

app.get('/health', async (req, res) => {
    res.status(200).send('Post service is healthy');
    /*
    const url = `http://user-service:3002/health`;

    console.log('Calling User Service:', url);

    // Call API 
    result = await axios.get(url);

    res.json(result.data);
    */
});

// Start the server
connectDb().then(() => {
    app.listen(PORT, async () => {
        console.log(`Post Service running on port ${PORT}`);

        try {
            await discoveryClient.register('post-service', 'post-service-instance-1', 'post-service', Number(PORT));
            console.log('Service registered successfully');
        } catch (err) {
            console.error('Failed to register service:', err);
            console.error("Status:", err.response?.statusCode);
            console.error("Headers:", err.response?.headers);
            console.error("Body:", err.response?.body?.toString());            
        }
    });
});