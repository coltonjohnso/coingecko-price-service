interface CryptoMapping {
    apiId: string;
    symbol: string;
    name: string;
}

export const CRYPTO_MAPPINGS: CryptoMapping[] = [
    {
        apiId: 'quai-network',
        symbol: 'QUAI',
        name: 'Quai Network'
    }
];

// Create lookup maps for efficient access
export const symbolToApiId = new Map<string, string>(
    CRYPTO_MAPPINGS.map(crypto => [crypto.symbol.toLowerCase(), crypto.apiId])
);

export const apiIdToSymbol = new Map<string, string>(
    CRYPTO_MAPPINGS.map(crypto => [crypto.apiId, crypto.symbol])
);

// Helper functions
export function getApiIdFromSymbol(symbol: string): string | undefined {
    return symbolToApiId.get(symbol.toLowerCase());
}

export function getSymbolFromApiId(apiId: string): string | undefined {
    return apiIdToSymbol.get(apiId);
}

// Get list of API IDs for price fetching
export const API_ID_LIST = CRYPTO_MAPPINGS.map(crypto => crypto.apiId); 