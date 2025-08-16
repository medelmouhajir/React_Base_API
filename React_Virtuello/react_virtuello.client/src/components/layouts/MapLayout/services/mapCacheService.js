// =============================================================================
// MAP CACHE SERVICE - Intelligent caching for map data
// =============================================================================

export const mapCacheService = {
    // Cache storage
    _cache: new Map(),
    _timestamps: new Map(),
    _accessTimes: new Map(),

    // Configuration
    MAX_CACHE_SIZE: 100,
    DEFAULT_TTL: 5 * 60 * 1000, // 5 minutes
    PREFETCH_TTL: 10 * 60 * 1000, // 10 minutes for prefetched data

    // Cache a map data result
    set(key, data, options = {}) {
        const {
            ttl = this.DEFAULT_TTL,
            priority = 'normal', // 'low', 'normal', 'high'
            tags = []
        } = options;

        const now = Date.now();
        const expiry = now + ttl;

        // Ensure cache doesn't exceed max size
        this._evictIfNeeded();

        this._cache.set(key, {
            data,
            expiry,
            priority,
            tags,
            size: this._calculateDataSize(data)
        });

        this._timestamps.set(key, now);
        this._accessTimes.set(key, now);

        return true;
    },

    // Get cached data
    get(key) {
        const cached = this._cache.get(key);

        if (!cached) {
            return null;
        }

        const now = Date.now();

        // Check if expired
        if (now > cached.expiry) {
            this.delete(key);
            return null;
        }

        // Update access time
        this._accessTimes.set(key, now);

        return {
            ...cached.data,
            fromCache: true,
            cacheTimestamp: this._timestamps.get(key),
            age: now - this._timestamps.get(key)
        };
    },

    // Check if data exists and is valid
    has(key) {
        const cached = this._cache.get(key);

        if (!cached) {
            return false;
        }

        const now = Date.now();

        if (now > cached.expiry) {
            this.delete(key);
            return false;
        }

        return true;
    },

    // Delete cached item
    delete(key) {
        this._cache.delete(key);
        this._timestamps.delete(key);
        this._accessTimes.delete(key);
        return true;
    },

    // Clear all cache
    clear() {
        this._cache.clear();
        this._timestamps.clear();
        this._accessTimes.clear();
    },

    // Clear cache by tags
    clearByTags(tags) {
        const keysToDelete = [];

        this._cache.forEach((value, key) => {
            if (value.tags.some(tag => tags.includes(tag))) {
                keysToDelete.push(key);
            }
        });

        keysToDelete.forEach(key => this.delete(key));
        return keysToDelete.length;
    },

    // Generate cache key for map data request
    generateKey(params) {
        const {
            bounds,
            location,
            radius,
            filters = {},
            searchQuery = ''
        } = params;

        // Create a normalized key
        const keyParts = [];

        if (bounds) {
            keyParts.push(
                `bounds:${bounds.north.toFixed(4)},${bounds.south.toFixed(4)},` +
                `${bounds.east.toFixed(4)},${bounds.west.toFixed(4)}`
            );
        }

        if (location) {
            keyParts.push(
                `location:${location.lat.toFixed(4)},${location.lng.toFixed(4)},${radius}`
            );
        }

        if (searchQuery.trim()) {
            keyParts.push(`search:${searchQuery.trim().toLowerCase()}`);
        }

        // Add filter parts
        const {
            selectedTags = [],
            selectedCategories = [],
            quickFilters = {},
            showBusinesses = true,
            showEvents = true
        } = filters;

        if (selectedTags.length > 0) {
            keyParts.push(`tags:${selectedTags.sort().join(',')}`);
        }

        if (selectedCategories.length > 0) {
            keyParts.push(`categories:${selectedCategories.sort().join(',')}`);
        }

        const activeQuickFilters = Object.entries(quickFilters)
            .filter(([_, value]) => value)
            .map(([key]) => key)
            .sort();

        if (activeQuickFilters.length > 0) {
            keyParts.push(`quick:${activeQuickFilters.join(',')}`);
        }

        keyParts.push(`types:${showBusinesses ? 'b' : ''}${showEvents ? 'e' : ''}`);

        return keyParts.join('|');
    },

    // Get cache statistics
    getStats() {
        const now = Date.now();
        let totalSize = 0;
        let expiredCount = 0;
        const priorities = { low: 0, normal: 0, high: 0 };

        this._cache.forEach((value, key) => {
            totalSize += value.size || 0;

            if (now > value.expiry) {
                expiredCount++;
            }

            priorities[value.priority] = (priorities[value.priority] || 0) + 1;
        });

        return {
            size: this._cache.size,
            maxSize: this.MAX_CACHE_SIZE,
            totalDataSize: totalSize,
            expiredCount,
            priorities,
            oldestEntry: Math.min(...Array.from(this._timestamps.values())),
            newestEntry: Math.max(...Array.from(this._timestamps.values()))
        };
    },

    // Evict items when cache is full
    _evictIfNeeded() {
        if (this._cache.size < this.MAX_CACHE_SIZE) {
            return;
        }

        const now = Date.now();
        const entries = Array.from(this._cache.entries());

        // Sort by priority and access time (LRU within priority)
        entries.sort((a, b) => {
            const [keyA, valueA] = a;
            const [keyB, valueB] = b;

            // First by priority (low priority gets evicted first)
            const priorityOrder = { high: 3, normal: 2, low: 1 };
            const priorityDiff = priorityOrder[valueA.priority] - priorityOrder[valueB.priority];

            if (priorityDiff !== 0) {
                return priorityDiff;
            }

            // Then by access time (least recently used first)
            const accessTimeA = this._accessTimes.get(keyA) || 0;
            const accessTimeB = this._accessTimes.get(keyB) || 0;

            return accessTimeA - accessTimeB;
        });

        // Remove expired items first
        const expiredKeys = entries
            .filter(([_, value]) => now > value.expiry)
            .map(([key]) => key);

        expiredKeys.forEach(key => this.delete(key));

        // If still too large, remove oldest low-priority items
        if (this._cache.size >= this.MAX_CACHE_SIZE) {
            const itemsToRemove = this._cache.size - this.MAX_CACHE_SIZE + 1;
            const keysToRemove = entries
                .slice(0, itemsToRemove)
                .map(([key]) => key);

            keysToRemove.forEach(key => this.delete(key));
        }
    },

    // Calculate approximate data size
    _calculateDataSize(data) {
        try {
            return JSON.stringify(data).length;
        } catch {
            return 1000; // Default estimate
        }
    },

    // Prefetch data for nearby areas
    async prefetchNearbyAreas(centerBounds, mapDataService) {
        const { north, south, east, west } = centerBounds;
        const latDiff = north - south;
        const lngDiff = east - west;

        // Define adjacent areas to prefetch
        const adjacentAreas = [
            // North
            {
                north: north + latDiff,
                south: north,
                east,
                west
            },
            // South
            {
                north: south,
                south: south - latDiff,
                east,
                west
            },
            // East
            {
                north,
                south,
                east: east + lngDiff,
                west: east
            },
            // West
            {
                north,
                south,
                east: west,
                west: west - lngDiff
            }
        ];

        // Prefetch data for each adjacent area
        const prefetchPromises = adjacentAreas.map(async (bounds) => {
            const key = this.generateKey({ bounds });

            // Only prefetch if not already cached
            if (!this.has(key)) {
                try {
                    const result = await mapDataService.getMapData({ bounds });
                    if (result.success) {
                        this.set(key, result.data, {
                            ttl: this.PREFETCH_TTL,
                            priority: 'low',
                            tags: ['prefetch']
                        });
                    }
                } catch (error) {
                    console.debug('Prefetch failed for area:', error.message);
                }
            }
        });

        await Promise.allSettled(prefetchPromises);
    },

    // Clean up expired entries
    cleanup() {
        const now = Date.now();
        const expiredKeys = [];

        this._cache.forEach((value, key) => {
            if (now > value.expiry) {
                expiredKeys.push(key);
            }
        });

        expiredKeys.forEach(key => this.delete(key));

        return expiredKeys.length;
    },

    // Schedule periodic cleanup
    startCleanupSchedule(intervalMs = 60000) { // 1 minute
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
        }

        this._cleanupInterval = setInterval(() => {
            const cleaned = this.cleanup();
            if (cleaned > 0) {
                console.debug(`Cleaned up ${cleaned} expired cache entries`);
            }
        }, intervalMs);
    },

    // Stop cleanup schedule
    stopCleanupSchedule() {
        if (this._cleanupInterval) {
            clearInterval(this._cleanupInterval);
            this._cleanupInterval = null;
        }
    }
};