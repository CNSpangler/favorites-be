
        // This part is coded after initial functionality is complete...

        // Select these ids from the favorites table, for _this user_
        const favorites = await client.query(`
            SELECT id
            FROM   favorites
            WHERE  user_id = $1;
        `, [req.userId]);

        // make a lookup of all favorite ids:

        const lookup = favorites.rows.reduce((acc, quote) => {
            acc[quote.id] = true;
            return acc;
        }, {});

        // adjust the favorite property of each item:
        quotes.forEach(quote => quote.isFavorite = lookup[quote.id] || false);

        // Ship it!
        res.json(quotes);
    }
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

app.get('/api/user/favorites', async(req, res) => {
    // Get the favorites _for the calling user_
    try {

const myQuery = `
                SELECT * FROM favorites
                    WHERE user_id=$1
            `
        const result = await client.query(`
            SELECT id, 
                character, 
                image, 
                quote, 
                user_id as "userId", 
                TRUE as "isFavorite"
            FROM   favorites
            WHERE user_id = $1;
        `, [req.userId]);

        res.json(result.rows);
    }
    
    catch (err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    }
});

app.post('/api/user/favorites', async(req, res) => {
    try {
        const addFavorite = await client.query(`
                INSERT INTO favorites (name, description, higher_level, user_id)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `);
    }

    res.json(newFavorite.rows[0]);

    catch(err) {
        console.log(err);
        res.status(500).json({
            error: err.message || err
        });
    } 
});

// const stringHash = require('string-hash');

// app.post('/api/me/favorites', async(req, res) => {
//     // Add a favorite _for the calling user_
//     try {
//         const quote = req.body;

//         const result = await client.query(`
//             INSERT INTO favorites (id, quote, user_id, character, image)
//             VALUES ($1, $2, $3, $4, $5)
//             RETURNING quote as id, character, image, quote, user_id as "userId";
//         `, [
//             // this first value is a shortcoming of this API, no id
//             stringHash(quote.quote),
//             quote.quote,
//             req.userId,
//             quote.character,
//             quote.image
//         ]);

//         res.json(result.rows[0]);

//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({
//             error: err.message || err
//         });
//     }
// });

// app.delete('/api/me/favorites/:id', (req, res) => {
//     // Remove a favorite, by favorite id _and the calling user_
//     try {
//         client.query(`
//             DELETE FROM favorites
//             WHERE id = $1
//             AND   user_id = $2;
//         `, [req.params.id, req.userId]);

//         res.json({ removed: true });
//     }
//     catch (err) {
//         console.log(err);
//         res.status(500).json({
//             error: err.message || err
//         });
//     }
// });

