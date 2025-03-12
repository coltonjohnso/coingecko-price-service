import express from 'express';
import type { Router, Request, Response } from 'express';
import { API_ID_LIST, getApiIdFromSymbol, getSymbolFromApiId } from '../config/crypto-symbols.js';
import { PriceData } from '../types/index.js';

export function setupPriceRoutes(priceCache: Map<string, PriceData>): Router {
    const router = express.Router();

    // API endpoint to get all prices
    router.get('/prices', (_req: Request, res: Response) => {
        const prices: Record<string, any> = {};
        let hasValidData = false;
        let hasErrors = false;

        API_ID_LIST.forEach(apiId => {
            const data = priceCache.get(apiId);
            const symbol = getSymbolFromApiId(apiId);
            if (!symbol) return; // Skip if no symbol mapping exists

            if (data && data.price !== null && data.marketCap !== null) {
                hasValidData = true;
                prices[symbol] = {
                    price: data.price,
                    marketCap: data.marketCap,
                    lastUpdated: data.lastUpdated
                };
            } else {
                hasErrors = true;
                prices[symbol] = {
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
    router.get('/price/:symbol', (req: Request, res: Response) => {
        const symbol = req.params.symbol.toUpperCase();
        const apiId = getApiIdFromSymbol(symbol);
        
        if (!apiId || !API_ID_LIST.includes(apiId)) {
            return res.status(404).json({ error: 'Cryptocurrency not found' });
        }

        const data = priceCache.get(apiId);
        if (!data || data.price === null || data.marketCap === null) {
            return res.status(503).json({
                error: data?.error || 'Price data not available',
                lastUpdated: data?.lastUpdated
            });
        }

        res.json({
            symbol,
            price: data.price,
            marketCap: data.marketCap,
            lastUpdated: data.lastUpdated
        });
    });

    // Health check endpoint with detailed status
    router.get('/health', (_req: Request, res: Response) => {
        const cryptoStatuses = Array.from(priceCache.entries()).map(([apiId, data]) => {
            const symbol = getSymbolFromApiId(apiId);
            return {
                symbol,
                apiId,
                healthy: data.price !== null && data.lastUpdated !== null && data.lastUpdated > new Date(Date.now() - 60000),
                lastUpdate: data.lastUpdated,
                updateAttempts: data.updateAttempts
            };
        });

        const allHealthy = cryptoStatuses.every(status => status.healthy);

        res.status(allHealthy ? 200 : 503).json({
            status: allHealthy ? 'healthy' : 'degraded',
            shutdownInProgress: false,
            cryptocurrencies: cryptoStatuses
        });
    });

    return router;
} 