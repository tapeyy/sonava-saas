import { LRUCache } from 'lru-cache';

// Cache configuration
const options = {
  max: 500, // Maximum number of items to store in cache
  ttl: 1000 * 60 * 5, // Time to live: 5 minutes
  allowStale: false,
  updateAgeOnGet: true,
  updateAgeOnHas: false,
};

// Create cache instance
const cache = new LRUCache(options);

export function getCachedData(key: string) {
  return cache.get(key);
}

export function setCachedData(key: string, value: any) {
  cache.set(key, value);
}

export function invalidateCache(key: string) {
  cache.delete(key);
}

export function clearCache() {
  cache.clear();
}
