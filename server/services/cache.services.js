const CACHE_TTL_MS = 60 * 1000;
const cache = new Map();

let cacheHits = 0;
let cacheMisses = 0;

function getCache(key) {
    const cached = cache.get(key);

    if (!cached) {
        cacheMisses++;
        return null;
    }

    if (Date.now() > cached.expiresAt) {
        cacheMisses++;
        cache.delete(key);
        return null;
    }

    cacheHits++;
    return cached.data;
}

function setCache(key, data) {
    cache.set(key, {
        data,
        expiresAt: Date.now() + CACHE_TTL_MS
    });
}

function getCacheStates() {
    return {
        cacheHits,
        cacheMisses,
        totalRequests: cacheHits + cacheMisses,
        cacheSize: cache.size,
        ttlSeconds: CACHE_TTL_MS / 1000
    };
}

function clearCache() {
    cache.clear();
    cacheHits = 0;
    cacheMisses = 0;
}

export {
    getCache,
    setCache,
    getCacheStates,
    clearCache
};
