import express from 'express';

const app = express();
const monitorPort = 3001;

const ErrorColor = "\x1b[48;5;236m";
const SuccessColor = "\x1b[48;5;236m";

const logfile = {};

app.use(express.json());

function getCurrentTime() {
    const date = new Date();
    const options = {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
    };
    return date.toLocaleString('en-US', options).replace(',', '')+`,${date.getMilliseconds()}`;
}

// Endpoint to receive logs from server.js
app.post('/log', (req, res) => {
    const logData = req.body;
    const logTime = getCurrentTime();
    logfile[logTime] = JSON.stringify(logData);
    console.log("\x1b[1m \x1b[38;5;196m  \x1b[0m \x1b[22m ", logTime);
    console.log("\x1b[22m \x1b[25m \x1b[34m Log received \x1b[0m");
    if (logData.status === 400) {
        console.log("\x1b[1m \x1b[38;5;196m Error: \x1b[0m \x1b[22m ");
        console.log("\x1b[5m", ErrorColor)
    } else if (logData.status === 500) {
        console.log("\x1b[1m \x1b[38;5;196m Error: \x1b[0m \x1b[22m ");
        console.log("\x1b[5m", ErrorColor)
    }
    console.log(logData);
    console.log("")
    res.status(200).send('Log received');
});

app.get('/logs', (req, res) => {
    console.log("sending logs to client");
    res.status(201).json({ endpoint: '/logs', method: 'GET', status: 201, message: 'this is the log file', data: logfile });
    console.log("\x1b[1m \x1b[38;5;196m  \x1b[0m \x1b[22m ", getCurrentTime());
    console.log("\x1b[22m \x1b[25m \x1b[34m Logs sent to client \x1b[0m");
    console.log("")
});

app.listen(monitorPort, () => {
    console.log(`\x1b[35m Monitoring server is running on http://localhost:${monitorPort} \x1b[0m`);
    console.log("");
    console.log("");
    //console.log("\x1b[32m Output with green text \x1b[0m")
    //console.log("\x1b[35m Output with magenta text \x1b[0m")
    //console.log("\x1b[34m Output with blue text \x1b[0m")
    
    //console.log("\x1b[41m Output with red background \x1b[0m")
    //console.log("\x1b[42m Output with green background \x1b[0m")
    //console.log("\x1b[43m Output with yellow background \x1b[0m")

    //console.log(`\x1b[34m Monitoring server is running on http://localhost:${monitorPort} \x1b[0m`);
});