import express from 'express';
import type { Express, Request, Response, NextFunction } from 'express';
import axios, { AxiosInstance } from 'axios';
import cors from 'cors';
import { API_ID_LIST } from './config/coingecko-api-ids.js';
import { PriceData } from './types/index.js';
import { setupPriceRoutes } from './api-routes/prices.js';
import { Server } from 'http';

const app: Express = express();
const port = process.env.PORT || 3000;
const COINGECKO_API_KEY = process.env.COINGECKO_API_KEY;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

const priceCache: Map<string, PriceData> = new Map();

let isShuttingDown = false;

// Initialize cache with supported cryptocurrencies
API_ID_LIST.forEach(cryptoId => {
    priceCache.set(cryptoId, {
        price: null,
        lastUpdated: null,
        error: null,
        updateAttempts: 0
    });
});

// Configure axios with defaults
const coingecko: AxiosInstance = axios.create({
    baseURL: 'https://api.coingecko.com/api/v3',
    timeout: 5000,
    headers: COINGECKO_API_KEY ? { 'x-cg-api-key': COINGECKO_API_KEY } : {}
});

function isValidPrice(price: number): boolean {
    return typeof price === 'number' && !isNaN(price) && price >= 0;
}

async function fetchCryptoPrices(): Promise<void> {
    if (isShuttingDown) return;

    const cryptoIds = API_ID_LIST.join(',');

    try {
        const response = await coingecko.get('/simple/price', {
            params: {
                ids: cryptoIds,
                vs_currencies: 'usd'
            }
        });

        API_ID_LIST.forEach(cryptoId => {
            const priceData = priceCache.get(cryptoId);
            const newPrice = response.data[cryptoId]?.usd;

            if (newPrice && isValidPrice(newPrice)) {
                priceCache.set(cryptoId, {
                    price: newPrice,
                    lastUpdated: new Date(),
                    error: null,
                    updateAttempts: 0
                });
                console.log(`[${new Date().toISOString()}] ${cryptoId} price updated: $${newPrice}`);
            } else {
                handlePriceUpdateError(cryptoId, new Error('Invalid price data received'));
            }
        });
    } catch (error: any) {
        const errorMessage = error.response?.data?.error || error.message;
        console.error(`[${new Date().toISOString()}] Error fetching prices:`, errorMessage);

        if (error.response?.status === 429) {
            console.warn(`[${new Date().toISOString()}] Rate limit hit, consider upgrading to CoinGecko Pro`);
            clearInterval(priceUpdateInterval);
            setTimeout(() => {
                priceUpdateInterval = setInterval(fetchCryptoPrices, 15000);
            }, 60000);
        }

        API_ID_LIST.forEach(cryptoId => {
            handlePriceUpdateError(cryptoId, error);
        });
    }
}

function handlePriceUpdateError(cryptoId: string, error: Error): void {
    const priceData = priceCache.get(cryptoId);
    if (!priceData) return;
    
    priceCache.set(cryptoId, {
        ...priceData,
        error: error.message,
        updateAttempts: priceData.updateAttempts + 1
    });

    if (priceData.updateAttempts >= 5) {
        console.error(`[${new Date().toISOString()}] Cryptocurrency ${cryptoId} failed to update 5 times`);
    }
}

// Initialize prices on startup
fetchCryptoPrices();

// Update prices every 15 seconds
let priceUpdateInterval: NodeJS.Timeout = setInterval(fetchCryptoPrices, 15000);

// Setup routes
app.use('/api', setupPriceRoutes(priceCache));

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(`[${new Date().toISOString()}] Unhandled error:`, err);
    res.status(500).json({ error: 'Internal server error' });
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error(`[${new Date().toISOString()}] Uncaught exception:`, err);
    gracefulShutdown();
});

process.on('unhandledRejection', (reason, promise) => {
    console.error(`[${new Date().toISOString()}] Unhandled rejection at:`, promise, 'reason:', reason);
    gracefulShutdown();
});

function gracefulShutdown(signal?: string): void {
    isShuttingDown = true;
    console.log(`[${new Date().toISOString()}] Received ${signal || 'shutdown'} signal. Starting graceful shutdown...`);

    clearInterval(priceUpdateInterval);

    server.close(() => {
        console.log(`[${new Date().toISOString()}] Server closed. Exiting process.`);
        process.exit(0);
    });

    setTimeout(() => {
        console.error(`[${new Date().toISOString()}] Could not close connections in time, forcefully shutting down`);
        process.exit(1);
    }, 10000);
}

const server: Server = app.listen(port, () => {
    console.log(`[${new Date().toISOString()}] Price service listening at http://localhost:${port}`);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT')); 