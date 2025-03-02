# CoinGecko Price Service

A backend service that fetches price data for a given list of cryptocurrenices using CoinGecko's API. 

## Features and core functionality
- Fetches cryptocurrency prices from CoinGecko every 15 seconds
- Caches prices until the next api call
- Easily configurable list for tracking different cryptocurrencies
- Simple REST API endpoints to get latest prices
- CORS enabled for frontend access
- Graceful shutdown handling
- Comprehensive error handling and logging
- Health check endpoint with detailed status
- Rate limit detection and automatic backoff
- Process error handling
- Optional CoinGecko API key support

## Prerequisites

- Node.js 18.x or higher
- npm 8.x or higher
- [CoinGecko API Key](https://www.coingecko.com/api/pricing) (optional, but recommended)

## Setup

1. Clone the repository:
```bash
git clone https://github.com/coltonjohnso/coingecko-price-service.git
cd coingecko-price-service
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

For development:
```bash
npm run dev
```

The server will start on port 3000 by default. You can change this by setting the `PORT` environment variable.

## API Endpoints

### Get All Prices
```http
GET /api/prices
```

Response:
```json
{
    "prices": {
        "kaspa": {
            "price": 0.10,
            "lastUpdated": "2024-03-02T12:00:00Z"
        },
        // ... other cryptocurrencies
    },
    "partial": false,
    "timestamp": "2024-03-02T12:00:00Z"
}
```

### Get Single Cryptocurrency Price
```http
GET /api/price/:cryptoId
```

Response:
```json
{
    "id": "bitcoin",
    "price": 50000,
    "lastUpdated": "2024-03-02T12:00:00Z"
}
```

### Health Check
```http
GET /api/health
```

Response:
```json
{
    "status": "healthy",
    "shutdownInProgress": false,
    "cryptocurrencies": [
        {
            "id": "bitcoin",
            "healthy": true,
            "lastUpdate": "2024-03-02T12:00:00Z",
            "updateAttempts": 0
        },
        // ... other cryptocurrencies
    ]
}
```
## Environment Variables

- `PORT`: Server port (default: 3000)
- `COINGECKO_API_KEY`: Optional API key

## Production Deployment

For production deployment, consider the following:

1. Use a process manager like PM2:
```bash
npm install -g pm2
pm2 start src/index.ts --name coingecko-price-service
```

2. Set up monitoring:
```bash
pm2 monitor
```

3. Configure environment variables in production:
```bash
export PORT=3000
export COINGECKO_API_KEY=your_api_key  # Optional
```

## Error Handling

The service includes several error handling mechanisms:

- Graceful shutdown on SIGTERM and SIGINT signals
- Automatic retry on CoinGecko API failures
- Rate limit detection and warning
- Detailed health check endpoint
- Process error handling for uncaught exceptions

## Logging

All important events are logged with timestamps:
- Price updates
- Error conditions
- API rate limiting
- Server start/stop
- Uncaught exceptions 

