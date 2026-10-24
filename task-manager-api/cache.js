const NodeCache = require('node-cache');

// Initialize in-memory cache with standard TTL of 60 seconds and auto-cleanup check every 120s
const nodeCache = new NodeCache({
  stdTTL: 60,
  checkperiod: 120,
  useClones: false // performance boost for read-only query caching
});

// Hit / Miss telemetry metrics (Supplementary Problem 2)
let hitCount = 0;
let missCount = 0;

/**
 * Retrieve an item from the cache and update telemetry.
 * @param {string} key - Cache key
 * @returns {any} Cached value or undefined
 */
const get = (key) => {
  const value = nodeCache.get(key);
  if (value !== undefined) {
    hitCount++;
    return value;
  }
  missCount++;
  return undefined;
};

/**
 * Store an item in the cache.
 * @param {string} key - Cache key
 * @param {any} val - Value to store
 * @param {number} [ttl] - Optional custom TTL in seconds
 */
const set = (key, val, ttl) => {
  if (ttl !== undefined) {
    return nodeCache.set(key, val, ttl);
  }
  return nodeCache.set(key, val);
};

/**
 * Delete a specific key from the cache.
 * @param {string} key - Cache key to invalidate
 */
const del = (key) => {
  return nodeCache.del(key);
};

/**
 * Invalidate all keys matching a given prefix.
 * @param {string} prefix - Key prefix
 */
const delPrefix = (prefix) => {
  const keys = nodeCache.keys();
  const matchingKeys = keys.filter((k) => k.startsWith(prefix));
  if (matchingKeys.length > 0) {
    nodeCache.del(matchingKeys);
  }
  return matchingKeys.length;
};

/**
 * Flush the entire in-memory cache.
 */
const flush = () => {
  return nodeCache.flushAll();
};

/**
 * Return current caching metrics and statistics for debug inspection.
 */
const getStats = () => {
  const totalRequests = hitCount + missCount;
  const hitRatio = totalRequests > 0 ? ((hitCount / totalRequests) * 100).toFixed(1) + '%' : '0%';
  const keys = nodeCache.keys();

  return {
    hits: hitCount,
    misses: missCount,
    totalRequests,
    hitRatio,
    activeKeysCount: keys.length,
    activeKeys: keys,
    stdTTL: 60,
    internalStats: nodeCache.getStats()
  };
};

module.exports = {
  nodeCache,
  get,
  set,
  del,
  delPrefix,
  flush,
  getStats
};
