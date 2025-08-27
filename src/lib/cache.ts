// Simple in-memory cache with TTL support
interface CacheEntry<T> {
  data: T
  timestamp: number
  ttl: number
}

class MemoryCache {
  private cache: Map<string, CacheEntry<any>> = new Map()
  private defaultTTL: number = 5 * 60 * 1000 // 5 minutes

  set<T>(key: string, data: T, ttl?: number): void {
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL
    }
    this.cache.set(key, entry)
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key)
    if (!entry) return null

    // Check if entry has expired
    const now = Date.now()
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    return entry.data as T
  }

  has(key: string): boolean {
    return this.get(key) !== null
  }

  delete(key: string): boolean {
    return this.cache.delete(key)
  }

  clear(): void {
    this.cache.clear()
  }

  size(): number {
    return this.cache.size
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key)
      }
    }
  }
}

// Create singleton instance
export const cache = new MemoryCache()

// Auto cleanup every 10 minutes
setInterval(() => {
  cache.cleanup()
}, 10 * 60 * 1000)

// Cache utilities for API responses
export const CacheKeys = {
  CASES: 'cases',
  CASE: (id: string) => `case:${id}`,
  DOCUMENTS: 'documents',
  DOCUMENT: (id: string) => `document:${id}`,
  USERS: 'users',
  USER: (id: string) => `user:${id}`,
  FOIL_REQUESTS: 'foil_requests',
  FOIL_REQUEST: (id: string) => `foil_request:${id}`,
  AUDIT_LOGS: 'audit_logs',
  REPORTS: (type: string) => `reports:${type}`,
  SEARCH: (query: string, type?: string) => `search:${type || 'all'}:${query}`,
} as const

// Cache wrapper for API calls
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl?: number
): Promise<T> {
  // Try to get from cache first
  const cached = cache.get<T>(key)
  if (cached !== null) {
    return cached
  }

  // Fetch and cache the result
  const data = await fetcher()
  cache.set(key, data, ttl)
  return data
}

// Invalidate related cache entries
export function invalidateCache(pattern: string): void {
  const keys = Array.from(cache['cache'].keys())
  keys.forEach(key => {
    if (key.includes(pattern)) {
      cache.delete(key)
    }
  })
}

// React hook for cached data
import { useState, useEffect, useCallback } from 'react'

interface UseCacheOptions<T> {
  key: string
  fetcher: () => Promise<T>
  ttl?: number
  enabled?: boolean
}

export function useCache<T>({
  key,
  fetcher,
  ttl,
  enabled = true
}: UseCacheOptions<T>) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    if (!enabled) return

    setLoading(true)
    setError(null)

    try {
      const result = await cachedFetch(key, fetcher, ttl)
      setData(result)
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'))
    } finally {
      setLoading(false)
    }
  }, [key, fetcher, ttl, enabled])

  const invalidate = useCallback(() => {
    cache.delete(key)
    fetchData()
  }, [key, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    invalidate
  }
}

// Background refresh for critical data
export class BackgroundRefresh {
  private intervals: Map<string, NodeJS.Timeout> = new Map()

  start<T>(
    key: string,
    fetcher: () => Promise<T>,
    interval: number = 30000, // 30 seconds
    ttl?: number
  ): void {
    if (this.intervals.has(key)) {
      this.stop(key)
    }

    const intervalId = setInterval(async () => {
      try {
        const data = await fetcher()
        cache.set(key, data, ttl)
      } catch (error) {
        console.warn(`Background refresh failed for key ${key}:`, error)
      }
    }, interval)

    this.intervals.set(key, intervalId)
  }

  stop(key: string): void {
    const intervalId = this.intervals.get(key)
    if (intervalId) {
      clearInterval(intervalId)
      this.intervals.delete(key)
    }
  }

  stopAll(): void {
    for (const [key, intervalId] of this.intervals.entries()) {
      clearInterval(intervalId)
    }
    this.intervals.clear()
  }
}

export const backgroundRefresh = new BackgroundRefresh()

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    backgroundRefresh.stopAll()
  })
}

// Preload critical data
export function preloadCriticalData(): void {
  // Preload data that's commonly accessed
  const criticalKeys = [
    { key: CacheKeys.CASES, fetcher: () => fetch('/api/cases').then(r => r.json()) },
    { key: CacheKeys.USERS, fetcher: () => fetch('/api/users').then(r => r.json()) },
    { key: CacheKeys.FOIL_REQUESTS, fetcher: () => fetch('/api/foil').then(r => r.json()) }
  ]

  criticalKeys.forEach(({ key, fetcher }) => {
    if (!cache.has(key)) {
      fetcher().then(data => cache.set(key, data)).catch(() => {
        // Silently fail preloading
      })
    }
  })
}

// Cache statistics for debugging
export function getCacheStats(): {
  size: number
  keys: string[]
  memory: number
} {
  const keys = Array.from(cache['cache'].keys())
  const estimatedMemory = JSON.stringify(Array.from(cache['cache'].values())).length
  
  return {
    size: cache.size(),
    keys,
    memory: estimatedMemory
  }
}