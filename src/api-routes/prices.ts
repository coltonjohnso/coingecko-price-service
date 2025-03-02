import express from 'express';
import type { Router, Request, Response } from 'express';
import { API_ID_LIST } from '../config/coingecko-api-ids.js';
import { PriceData } from '../types/index.js';

export function setupPriceRoutes(priceCache: Map<string, PriceData>): Router {
    const router = express.Router();

    // API endpoint to get all prices
    router.get('/prices', (_req: Request, res: Response) => {
        const prices: Record<string, any> = {};
        let hasValidData = false;
        let hasErrors = false;

        API_ID_LIST.forEach(cryptoId => {
            const data = priceCache.get(cryptoId);
            if (data && data.price !== null) {
                hasValidData = true;
                prices[cryptoId] = {
                    price: data.price,
                    lastUpdated: data.lastUpdated
                };
            } else {
                hasErrors = true;
                prices[cryptoId] = {
                    error: data?.error || 'Price data not available',
                    lastUpdated: data?.lastUpdated
                };
            }
        });

        if (!hasValidData) {
            return res.status(503).json({
                error: 'No valid price data available',
                prices
            });
        }

        res.json({
            prices,
            partial: hasErrors,
            timestamp: new Date()
        });
    });

    // Single cryptocurrency price endpoint
    router.get('/price/:cryptoId', (req: Request, res: Response) => {
        const cryptoId = req.params.cryptoId;
        
        if (!API_ID_LIST.includes(cryptoId)) {
            return res.status(404).json({ error: 'Cryptocurrency not found' });
        }

        const data = priceCache.get(cryptoId);
        if (!data || data.price === null) {
            return res.status(503).json({
                error: data?.error || 'Price data not available',
                lastUpdated: data?.lastUpdated
            });
        }

        res.json({
            id: cryptoId,
            price: data.price,
            lastUpdated: data.lastUpdated
        });
    });

    // Health check endpoint with detailed status
    router.get('/health', (_req: Request, res: Response) => {
        const cryptoStatuses = Array.from(priceCache.entries()).map(([cryptoId, data]) => ({
            id: cryptoId,
            healthy: data.price !== null && data.lastUpdated !== null && data.lastUpdated > new Date(Date.now() - 60000),
            lastUpdate: data.lastUpdated,
            updateAttempts: data.updateAttempts
        }));

        const allHealthy = cryptoStatuses.every(status => status.healthy);

        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            shutdownInProgress: false,
            cryptocurrencies: cryptoStatuses
        });
    });

    return router;
} 