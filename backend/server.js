import express from 'express';
import pkg from "pg";
import cors from 'cors';
import dotenv from 'dotenv';
import http from 'http';

dotenv.config();

console.log("Configuring environment variables");
const { Pool } = pkg;
const app = express();
const port = 3000;

console.log("Configuring pool");
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASS,
    port: 5432,
});

console.log("Configuring app");
app.use(express.json());
app.use(cors());


console.log("defining functions");
// Function to send logs to monitor.js
function sendLogToMonitor(logData) {
    const options = {
        hostname: 'localhost',
        port: 3001, // Port where monitor.js is running
        path: '/log',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    const req = http.request(options, (res) => {
        res.on('data', (chunk) => {
            //console.log(`Monitor Response: ${chunk.toString()}`);
        });
    });

    req.on('error', (error) => {
        console.error(`Error sending log to monitor: ${error.message}`);
    });

    req.write(JSON.stringify(logData));
    req.end();
}

async function getLogfromMonitor(resin) {
    const options = {
        hostname: 'localhost',
        port: 3001, // Port where monitor.js is running
        path: '/logs',
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    };

    let data = {};

    const req = await http.request(options, (res) => {
        res.on('data', (chunk) => {
            
            data = JSON.parse(chunk.toString());
            for (let i in data.data) {
                const element = JSON.parse(data.data[i]);
                data.data[i] = element
            }
            resin.json({ status: 201, logs: data.data });
        });
        
    });

    req.on('error', (error) => {
        console.error(`Error sending log to monitor: ${error.message}`);
    });

    //req.write(JSON.stringify());
    req.end();
    setTimeout(() => { return (data); }, 1500)
    
}

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
            console.error(`500, getVotes has error: ${error}`);
            sendLogToMonitor({status: 500, error: `getVotes has error: ${error}` });
            return;
        }
    
};
async function updateVote(candidateId, candidateName) {
    try {
        const votenumb = await getVotes(candidateId);
        const newnumb = (parseInt(votenumb) + 1).toString();
        const result = await pool.query(
            'UPDATE candidates SET candidate_votes = $1 WHERE candidate_name = $2',
            [newnumb, candidateName]
        );
        return result.rows;
    }
    catch (error) {
        console.error(`500, updateVote has error: ${error}`);
        sendLogToMonitor({status: 500, error: `updateVote has error: ${error}` });
        return;
    }
}

console.log("Configuring endpoints");
app.get('/candidates', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM candidates');
        res.json(result.rows);
        sendLogToMonitor({ endpoint: '/candidates', method: 'GET', status: 200, Data: result.rows });
    } catch (error) {
        res.status(500).json({ error: error.message });
        sendLogToMonitor({ endpoint: '/candidates', method: 'GET', status: 500, error: error.message });
    }
});

app.post('/vote', async (req, res) => {
    const { candidateId } = req.body;
    try {
        const { voted_for_candidate, voter_id, voted_for_candidate_numb } = req.body;

        if (await checkVotes(voter_id)) {
            res.status(400).json({ message: 'You have already voted' });
            sendLogToMonitor({ endpoint: '/vote', method: 'POST', status: 400, message: 'You have already voted', Data: result.rows });
            return;
        }

        updateVote(voted_for_candidate_numb, voted_for_candidate);
        const result = await pool.query(
            'INSERT INTO votes (voted_for_candidate, voter_id, voted_for_candidate_numb) VALUES ($1, $2, $3)',
            [voted_for_candidate, voter_id, voted_for_candidate_numb]
        );
        sendLogToMonitor({ message: 'sent vote to server.', voted_for_candidate: voted_for_candidate, voter_id: voter_id, voted_for_candidate_numb: voted_for_candidate_numb });

        res.status(201).json({ message: 'Vote has been cast', user: result.rows[0] });
        sendLogToMonitor({ endpoint: '/vote', method: 'POST', status: 201, message: 'Vote has been cast', Data: result.rows });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
        sendLogToMonitor({ endpoint: '/vote', method: 'POST', status: 500, error: error.message });
    }
});

app.get('/monitor/1234', async (req, res) => {
    try {
        await getLogfromMonitor(res);
        
        
        
    } catch (error) {
        res.status(500).json({ status: 500, error: error.message });
        console.error(error);
    }
});

app.param('path', function (req, res, next, id) {
    sendLogToMonitor({ endpoint: `/${id}`, method: req.method, status: 404, message: `endpoint "/${id}" not found` });
    res.status(404).json({ status: 404, error: "endpoint not found" });
    next()
})
app.get('/:path', async (req, res) => {
    //send log handeld by app.param
});
app.post('/:path', async (req, res) => {
    //send log handeld by app.param
});

app.get('/', async (req, res) => {
    sendLogToMonitor({ endpoint: '/', method: 'GET', status: 200, message: '' });
    res.status(404).json({ status: 200, message: "no endpoint" });
});
app.post('/', async (req, res) => {
    sendLogToMonitor({ endpoint: '/', method: 'POST', status: 200, message: '' });
    res.status(404).json({ status: 200, message: "no endpoint" });
});

app.listen(port, () => {
    console.log("\x1b[H \u001b[0J \u001b[1J \u001b[2J");
    console.log(`\x1b[H \x1b[35m Server is running on http://localhost:${port} \x1b[0m`);
});