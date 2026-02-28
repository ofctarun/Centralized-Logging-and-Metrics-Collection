const fs = require('fs');
const axios = require('axios');

const LOG_FILE = process.env.LOG_FILE || '/var/log/app/app.log';
const LOG_AGGREGATOR_URL = process.env.LOG_AGGREGATOR_URL;
const SERVICE_NAME = process.env.SERVICE_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

if (!LOG_AGGREGATOR_URL || !SERVICE_NAME || !ENVIRONMENT) {
    console.error('Missing required environment variables: LOG_AGGREGATOR_URL, SERVICE_NAME, ENVIRONMENT');
    process.exit(1);
}

console.log(`Starting logging sidecar for ${SERVICE_NAME} in ${ENVIRONMENT}`);
console.log(`Tailing ${LOG_FILE}...`);

// Simple tail implementation
let fileSize = 0;

// Initialize file size to skip existing logs or read from start
if (fs.existsSync(LOG_FILE)) {
    fileSize = fs.statSync(LOG_FILE).size;
}

const processNewLogs = () => {
    if (!fs.existsSync(LOG_FILE)) return;

    const stats = fs.statSync(LOG_FILE);
    if (stats.size < fileSize) {
        // File was truncated
        fileSize = 0;
    }

    if (stats.size > fileSize) {
        const stream = fs.createReadStream(LOG_FILE, {
            start: fileSize,
            end: stats.size - 1
        });

        let data = '';
        stream.on('data', (chunk) => {
            data += chunk.toString();
        });

        stream.on('end', async () => {
            const lines = data.split('\n').filter(line => line.trim() !== '');
            for (const line of lines) {
                try {
                    const logEntry = JSON.parse(line);
                    const enrichedLog = {
                        ...logEntry,
                        service_name: SERVICE_NAME,
                        environment: ENVIRONMENT
                    };

                    await axios.post(LOG_AGGREGATOR_URL, enrichedLog);
                    console.log(`Forwarded log: ${enrichedLog.message}`);
                } catch (err) {
                    console.error('Error processing log line:', err.message);
                }
            }
        });

        fileSize = stats.size;
    }
};

// Poll the file for changes
setInterval(processNewLogs, 1000);

// Health check endpoint for Docker
const http = require('http');
http.createServer((req, res) => {
    res.writeHead(200);
    res.end('OK');
}).listen(8081);
