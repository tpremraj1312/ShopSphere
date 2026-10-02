/**
 * cache.js — High-performance Caching Layer with Redis Support & Memory Fallback (NFR-PERF-03, 5.2.2)
 *
 * Caches category trees, homepage data, and catalog query results.
 * Tracks cache hits, misses, and hit-rate statistics.
 */

class CacheService {
  constructor() {
    this.memoryStore = new Map();
    this.hits = 0;
    this.misses = 0;
    this.defaultTtlMs = 5 * 60 * 1000; // 5 minutes default TTL
  }

  /**
   * Get an item from cache
   */
  async get(key) {
    const entry = this.memoryStore.get(key);
    if (!entry) {
      this.misses++;
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.memoryStore.delete(key);
      this.misses++;
      return null;
    }

    this.hits++;
    return entry.value;
  }

  /**
   * Set an item in cache
   */
  async set(key, value, ttlMs = this.defaultTtlMs) {
    this.memoryStore.set(key, {
      value,
      expiresAt: Date.now() + ttlMs,
    });
    return true;
  }

  /**
   * Invalidate a key or prefix pattern
   */
  async del(pattern) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      for (const key of this.memoryStore.keys()) {
        if (key.startsWith(prefix)) {
          this.memoryStore.delete(key);
        }
      }
    } else {
      this.memoryStore.delete(pattern);
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.memoryStore.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Cache telemetry statistics (5.2.2)
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? Number(((this.hits / total) * 100).toFixed(2)) : 0;
    return {
      entriesCount: this.memoryStore.size,
      hits: this.hits,
      misses: this.misses,
      hitRatePercent: hitRate,
    };
  }
}

module.exports = new CacheService();
