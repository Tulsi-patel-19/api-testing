const CACHE_TTL_MS = 60 * 1000;
// cached data expire after 1 min
const cache = new Map();
// map store key and value pair , key -> url , value -> data+ expiretime

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
        // expire -> from starting to 1 min
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
    // clear() -> remove every entries from map 
    cacheHits = 0;
    cacheMisses = 0;
}

export {
    getCache,
    setCache,
    getCacheStates,
    clearCache
};
