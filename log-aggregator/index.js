const express = require('express');
const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

let logs = [];

app.post('/logs', (req, res) => {
    const logEntry = req.body;
    
    // Basic validation
    if (!logEntry.level || !logEntry.message || !logEntry.timestamp || !logEntry.service_name || !logEntry.environment) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    console.log(`[${logEntry.service_name}] [${logEntry.level}] ${logEntry.message}`);
    
    // Store last 10 logs
    logs.push(logEntry);
    if (logs.length > 10) {
        logs.shift();
    }

    res.status(202).send();
});

app.get('/logs', (req, res) => {
    res.json(logs);
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Log Aggregator listening at http://localhost:${port}`);
});
