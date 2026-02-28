const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;
const serviceName = process.env.SERVICE_NAME || 'app-service';

const LOG_FILE = '/var/log/app/app.log';

// Ensure log directory exists (Docker volume handles this, but good for local)
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

// Custom Logger
const log = (level, message) => {
    const logEntry = {
        level,
        message,
        timestamp: new Date().toISOString()
    };
    const logLine = JSON.stringify(logEntry) + '\n';
    fs.appendFileSync(LOG_FILE, logLine);
    console.log(`[${level.toUpperCase()}] ${message}`);
};

// Metrics
let requestCount = 0;

app.use((req, res, next) => {
    requestCount++;
    log('info', `Received ${req.method} request for ${req.url}`);
    next();
});

app.get('/', (req, res) => {
    res.send(`Hello from ${serviceName}`);
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(`# HELP http_requests_total The total number of HTTP requests.
# TYPE http_requests_total counter
http_requests_total{service_name="${serviceName}"} ${requestCount}
`);
});

app.listen(port, () => {
    log('info', `${serviceName} started on port ${port}`);
});
