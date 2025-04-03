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
        const result = await pool.query('SELECT * FROM candidates');
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});


async function checkVotes(voter_id) {
    try {
        const result = await pool.query('SELECT voter_id FROM votes');
        for (let i = 0; i < result.rows.length; i++) {
            if (result.rows[i].voter_id === voter_id) {
                return true;
            }
        }
        return false;
    } catch (error) {
        console.error(`500, Error: ${error}`);
        return `500, Error: ${error.message}`;
    }
}

async function getVotes(ID) {
    try {
        const result = await pool.query('SELECT * FROM candidates');
        return result.rows[ID].candidate_votes;
    } catch (error) {
        console.error(`500, Error: ${error}`);
        return;
    }
}

async function updateVote(candidateId, candidateName) {
    try {
        const votenumb = await getVotes(candidateId);
        const newnumb = (parseInt(votenumb) + 1).toString();
        const result = await pool.query(
            'UPDATE candidates SET candidate_votes = $1 WHERE candidate_name = $2',
            [newnumb, candidateName]
        );
        return result.rows;
    } catch (error) {
        console.error(`500, Error: ${error}`);
        return;
    }
}

app.post('/vote', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const { voted_for_candidate, voter_id, voted_for_candidate_numb } = req.body;

        if (await checkVotes(voter_id)) {
            res.status(400).json({ message: 'You have already voted' });
            return;
        }

        updateVote(voted_for_candidate_numb, voted_for_candidate)
        const result = await pool.query(
            'INSERT INTO votes (voted_for_candidate, voter_id, voted_for_candidate_numb) VALUES ($1, $2, $3)',
            [voted_for_candidate, voter_id, voted_for_candidate_numb]
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