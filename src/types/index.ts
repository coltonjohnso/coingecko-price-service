export interface PriceData {
    price: number | null;
    marketCap: number | null;
    lastUpdated: Date | null;
    error: string | null;
    updateAttempts: number;
}

export interface CryptoStatus {
    id: string;
    healthy: boolean;
    lastUpdate: Date | null;
    updateAttempts: number;
}

export interface PriceResponse {
    id: string;
    price: number;
    marketCap: number;
    lastUpdated: Date;
}

export interface PricesResponse {
    prices: Record<string, {
        price?: number;
        marketCap?: number;
        lastUpdated?: Date;
        error?: string;
    }>;
    partial?: boolean;
    timestamp: Date;
    error?: string;
}

export interface HealthResponse {
    status: 'healthy' | 'degraded';
    shutdownInProgress: boolean;
    cryptocurrencies: CryptoStatus[];
} 