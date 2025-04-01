import express from 'express';
import pkg from "pg";
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;
const app = express();
const port = 3000;

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

app.use(express.json());
app.use(cors());

app.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM votingApp.candidates');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/vote', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const { voterID, candidateVote } = req.body;

        const result = await pool.query(
            'INSERT INTO votingApp.votes (voter_id, candidate_id) VALUES ($1, $2)',
            [voterID, candidateVote]
        );

        res.status(201).json({ message: 'Vote has been cast' , user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
});


app.listen(port, () => {
    console.info(`Server is running on http://localhost:${port}`);
});