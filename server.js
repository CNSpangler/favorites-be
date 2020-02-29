// Load Environment Variables from the .env file
require('dotenv').config();

// Application Dependencies
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
// Database Client
const client = require('./lib/client');
const request = require('superagent');
// Services
// const quotesApi = require('./lib/quotes-api');

// Auth
const ensureAuth = require('./lib/auth/ensure-auth');
const createAuthRoutes = require('./lib/auth/create-auth-routes');
const authRoutes = createAuthRoutes({
    async selectUser(email) {
        const result = await client.query(`
            SELECT id, email, hash, display_name 
            FROM users
            WHERE email = $1;
        `, [email]);
        return result.rows[0];
    },
    async insertUser(user, hash) {
        console.log(user);
        const result = await client.query(`
            INSERT into users (email, hash, display_name)
            VALUES ($1, $2, $3)
            RETURNING id, email, display_name;
        `, [user.email, hash, user.display_name]);
        return result.rows[0];
    }
});

// Application Setup
const app = express();
// const PORT = process.env.PORT;
app.use(morgan('dev')); // http logging
app.use(cors()); // enable CORS request
app.use(express.static('public')); // server files from /public folder
app.use(express.json()); // enable reading incoming json data
app.use(express.urlencoded({ extended: true }));

// setup authentication routes
app.use('/api/auth', authRoutes);

// everything that starts with "/api" below here requires an auth token!
app.use('/api/me', ensureAuth);

// *** API Routes ***
// Get spells data from API
app.get('/api', async(req, res) => {
    try {
        const data = await request.get(`http://www.dnd5eapi.co/api/`);   
        res.json(data.body);
    } catch (e) {
        console.error(e);
    }
});

// Get data for searched spell
app.get('/api/spells', async(req, res) => {
    try {
        const data = await request.get(`http://www.dnd5eapi.co/api/${req.query.name}`);   
        res.json(data.body);
    } catch (e) {
        console.error(e);
    }
});

// Get any existing favorites for the logged-in user
app.get('/api/me/favorites', async(req, res) => {
    try {
        const myQuery = `
            SELECT * FROM favorites
            WHERE user_id=$1
        `;
        
        const favorites = await client.query(myQuery, [req.userId]);
        
        res.json(favorites.rows);

    } catch (e) {
        console.error(e);
    }
});

// Post route for adding a new favorite to user's list
app.post('/api/me/favorites', async(req, res) => {
    try {
        const newFavorites = await client.query(`
            INSERT INTO favorites (name, description, higher_level, user_id)
            values ($1, $2, $3, $4)
            returning *
        `, [
            req.body.name, 
            req.body.description, 
            req.body.higher_level, 
            req.userId,
        ]);

        res.json(newFavorites.rows[0]);

    } catch (e) {
        console.error(e);
    }
});

// Delete a favorite
app.delete('/api/me/favorites/:id', async(req, res) => {
    try {
        const myQuery = `
            DELETE * FROM favorites
            WHERE id=$1
            RETURNING *
        `;
        
        const favorites = await client.query(myQuery, [req.params.id]);
        
        res.json(favorites.rows);

    } catch (e) {
        console.error(e);
    }
});

// // Start the server
// app.get('/api', (req, res) => {
//     res.send('does it work?');
// });

app.listen(process.env.PORT, () => {
    console.log('server running on PORT', process.env.PORT);
});