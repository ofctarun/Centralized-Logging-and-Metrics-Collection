const express = require('express');
const axios = require('axios');
const app = express();
const port = 9100;

const APP_METRICS_URL = process.env.APP_METRICS_URL;
const SERVICE_NAME = process.env.SERVICE_NAME;
const ENVIRONMENT = process.env.ENVIRONMENT;

if (!APP_METRICS_URL || !SERVICE_NAME || !ENVIRONMENT) {
    console.error('Missing required environment variables: APP_METRICS_URL, SERVICE_NAME, ENVIRONMENT');
    process.exit(1);
}

let enrichedMetrics = '';

const scrapeAndEnrich = async () => {
    try {
        const response = await axios.get(APP_METRICS_URL);
        const data = response.data;

        // Function to add labels to a metric line
        // Example: http_requests_total{method="GET"} 10
        // To: http_requests_total{method="GET",service_name="user-service",environment="development"} 10

        const lines = data.split('\n');
        const enrichedLines = lines.map(line => {
            if (line.startsWith('#') || line.trim() === '') return line;

            const labelInjection = `service_name="${SERVICE_NAME}",environment="${ENVIRONMENT}"`;

            if (line.includes('{')) {
                // Already has labels, append ours
                return line.replace('{', `{${labelInjection},`);
            } else {
                // No labels, create them
                const parts = line.split(' ');
                if (parts.length >= 2) {
                    const metricName = parts[0];
                    const value = parts.slice(1).join(' ');
                    return `${metricName}{${labelInjection}} ${value}`;
                }
            }
            return line;
        });

        enrichedMetrics = enrichedLines.join('\n');
    } catch (err) {
        console.error('Error scraping metrics:', err.message);
    }
};

// Initial scrape
scrapeAndEnrich();

// Periodically scrape
setInterval(scrapeAndEnrich, 15000);

app.get('/metrics', (req, res) => {
    res.set('Content-Type', 'text/plain');
    res.send(enrichedMetrics);
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

app.listen(port, () => {
    console.log(`Metrics Sidecar listening on port ${port}`);
});
