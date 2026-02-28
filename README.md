# Centralized Logging and Metrics Collection via Sidecar Pattern

This project demonstrates the sidecar pattern in a Docker environment to decouple cross-cutting concerns like logging and metrics collection from the core application logic.

## Architecture

The system consists of:
- **Application Services**: `user-service`, `product-service`, `order-service`. Simple Node.js apps that write logs to a file and expose metrics.
- **Logging Sidecars**: Tail the application log files, enrich entries with metadata (`service_name`, `environment`), and forward them to a central aggregator.
- **Metrics Sidecars**: Scrape application `/metrics` endpoints, inject labels, and re-expose them on dedicated ports.
- **Log Aggregator**: A mock service that receives logs via HTTP POST and exposes the last 10 logs via HTTP GET.

## Prerequisites

- Docker
- Docker Compose

## Setup and Execution

1.  **Clone the repository**.
2.  **Create `.env` file** (optional, defaults are provided in `docker-compose.yml`):
    ```bash
    cp .env.example .env
    ```
3.  **Start the services**:
    ```bash
    docker-compose up -d
    ```
4.  **Wait for services to be healthy**:
    ```bash
    docker-compose ps
    ```

## Verification

### 1. Health Checks
All services should be marked as `healthy` in `docker-compose ps`.

### 2. Logging Pipeline
- **Trigger a log**: Hit an app service endpoint, e.g., `curl http://localhost:3001`
- **Check Aggregator**: `curl http://localhost:8080/logs`
- **Expected Results**: You should see JSON log entries enriched with `service_name: "user-service"` and `environment: "development"`.

### 3. Metrics Pipeline
- **Check Enriched Metrics**: `curl http://localhost:9101/metrics`
- **Expected Results**: Metrics should include `service_name="user-service"` and `environment="development"` labels.
  Example: `http_requests_total{service_name="user-service",environment="development"} 5`

### 4. Shared Volume (internal)
You can verify the log file exists inside the app container:
```bash
docker-compose exec user-service ls -l /var/log/app/app.log
```

## Environment Variables

Defined in `.env.example`:
- `USER_SERVICE_PORT`: Port for user-service (default: 3001)
- `PRODUCT_SERVICE_PORT`: Port for product-service (default: 3002)
- `ORDER_SERVICE_PORT`: Port for order-service (default: 3003)
- `LOG_AGGREGATOR_URL`: Internal URL for the aggregator.
- `ENVIRONMENT`: Deployment environment label.
