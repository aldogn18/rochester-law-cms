// Search functionality with indexing and relevance scoring

interface SearchIndex {
  id: string
  type: 'case' | 'document' | 'user' | 'foil'
  title: string
  content: string
  metadata: Record<string, any>
  tags: string[]
  lastModified: Date
}

interface SearchResult {
  id: string
  type: 'case' | 'document' | 'user' | 'foil'
  title: string
  snippet: string
  score: number
  metadata: Record<string, any>
  highlights: string[]
}

interface SearchOptions {
  types?: Array<'case' | 'document' | 'user' | 'foil'>
  limit?: number
  offset?: number
  sortBy?: 'relevance' | 'date' | 'title'
  filters?: Record<string, any>
}

class SearchEngine {
  private index: Map<string, SearchIndex> = new Map()
  private stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does',
    'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that',
    'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her',
    'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their'
  ])

  // Add or update an item in the search index
  addToIndex(item: SearchIndex): void {
    this.index.set(item.id, item)
  }

  // Remove an item from the search index
  removeFromIndex(id: string): void {
    this.index.delete(id)
  }

  // Clear the entire index
  clearIndex(): void {
    this.index.clear()
  }

  // Tokenize and clean text for searching
  private tokenize(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !this.stopWords.has(word))
  }

  // Calculate relevance score for a document
  private calculateScore(searchTerms: string[], item: SearchIndex): number {
    let score = 0
    const titleTokens = this.tokenize(item.title)
    const contentTokens = this.tokenize(item.content)
    const tagTokens = item.tags.map(tag => tag.toLowerCase())

    searchTerms.forEach(term => {
      // Exact title match gets highest score
      if (item.title.toLowerCase().includes(term)) {
        score += 10
      }

      // Title word matches get high score
      titleTokens.forEach(titleToken => {
        if (titleToken.includes(term)) {
          score += 5
        }
      })

      // Tag matches get medium-high score
      tagTokens.forEach(tag => {
        if (tag.includes(term)) {
          score += 3
        }
      })

      // Content matches get lower score
      contentTokens.forEach(contentToken => {
        if (contentToken.includes(term)) {
          score += 1
        }
      })

      // Metadata matches
      Object.values(item.metadata).forEach(value => {
        if (String(value).toLowerCase().includes(term)) {
          score += 2
        }
      })
    })

    // Boost score for recent items
    const daysSinceModified = (Date.now() - item.lastModified.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceModified < 7) {
      score *= 1.2
    } else if (daysSinceModified < 30) {
      score *= 1.1
    }

    return score
  }

  // Generate snippet with highlighted terms
  private generateSnippet(searchTerms: string[], content: string, maxLength = 150): { snippet: string; highlights: string[] } {
    const highlights: string[] = []
    let snippet = content

    // Find the best snippet location (containing most search terms)
    const sentences = content.split(/[.!?]+/)
    let bestSentence = ''
    let maxTermCount = 0

    sentences.forEach(sentence => {
      const termCount = searchTerms.filter(term => 
        sentence.toLowerCase().includes(term)
      ).length
      
      if (termCount > maxTermCount) {
        maxTermCount = termCount
        bestSentence = sentence.trim()
      }
    })

    if (bestSentence && bestSentence.length <= maxLength) {
      snippet = bestSentence
    } else {
      // Truncate to maxLength
      snippet = content.substring(0, maxLength)
      if (content.length > maxLength) {
        snippet += '...'
      }
    }

    // Collect highlights
    searchTerms.forEach(term => {
      const regex = new RegExp(`\\b${term}\\b`, 'gi')
      const matches = snippet.match(regex)
      if (matches) {
        highlights.push(...matches)
      }
    })

    return { snippet, highlights }
  }

  // Perform search
  search(query: string, options: SearchOptions = {}): SearchResult[] {
    const {
      types,
      limit = 50,
      offset = 0,
      sortBy = 'relevance',
      filters = {}
    } = options

    if (!query.trim()) {
      return []
    }

    const searchTerms = this.tokenize(query)
    if (searchTerms.length === 0) {
      return []
    }

    const results: SearchResult[] = []

    // Search through the index
    for (const [id, item] of this.index) {
      // Apply type filter
      if (types && !types.includes(item.type)) {
        continue
      }

      // Apply custom filters
      let matchesFilters = true
      for (const [key, value] of Object.entries(filters)) {
        if (item.metadata[key] !== value) {
          matchesFilters = false
          break
        }
      }
      if (!matchesFilters) {
        continue
      }

      // Calculate relevance score
      const score = this.calculateScore(searchTerms, item)
      if (score === 0) {
        continue
      }

      // Generate snippet and highlights
      const { snippet, highlights } = this.generateSnippet(searchTerms, item.content)

      results.push({
        id,
        type: item.type,
        title: item.title,
        snippet,
        score,
        metadata: item.metadata,
        highlights
      })
    }

    // Sort results
    results.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.metadata.lastModified || 0).getTime() - 
                 new Date(a.metadata.lastModified || 0).getTime()
        case 'title':
          return a.title.localeCompare(b.title)
        case 'relevance':
        default:
          return b.score - a.score
      }
    })

    // Apply pagination
    return results.slice(offset, offset + limit)
  }

  // Get search suggestions/autocomplete
  getSuggestions(query: string, limit = 10): string[] {
    if (!query.trim() || query.length < 2) {
      return []
    }

    const suggestions = new Set<string>()
    const queryLower = query.toLowerCase()

    // Collect suggestions from titles, tags, and common terms
    for (const item of this.index.values()) {
      // Title suggestions
      if (item.title.toLowerCase().includes(queryLower)) {
        suggestions.add(item.title)
      }

      // Tag suggestions
      item.tags.forEach(tag => {
        if (tag.toLowerCase().includes(queryLower)) {
          suggestions.add(tag)
        }
      })

      // Stop when we have enough suggestions
      if (suggestions.size >= limit * 2) {
        break
      }
    }

    return Array.from(suggestions)
      .slice(0, limit)
      .sort((a, b) => a.length - b.length) // Prefer shorter matches
  }

  // Get index statistics
  getStats(): {
    totalItems: number
    itemsByType: Record<string, number>
    indexSize: number
  } {
    const itemsByType: Record<string, number> = {}
    let indexSize = 0

    for (const item of this.index.values()) {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1
      indexSize += JSON.stringify(item).length
    }

    return {
      totalItems: this.index.size,
      itemsByType,
      indexSize
    }
  }
}

// Create singleton search engine
export const searchEngine = new SearchEngine()

// Helper functions for different data types
export function indexCase(caseData: any): void {
  searchEngine.addToIndex({
    id: caseData.id,
    type: 'case',
    title: caseData.title,
    content: `${caseData.description} ${caseData.clientDepartment} ${caseData.judge || ''} ${caseData.courtJurisdiction || ''}`,
    metadata: {
      type: caseData.type,
      status: caseData.status,
      priority: caseData.priority,
      assignedAttorney: caseData.assignedAttorney,
      clientDepartment: caseData.clientDepartment,
      lastModified: caseData.dateLastActivity
    },
    tags: caseData.tags || [],
    lastModified: new Date(caseData.dateLastActivity)
  })
}

export function indexDocument(documentData: any): void {
  searchEngine.addToIndex({
    id: documentData.id,
    type: 'document',
    title: documentData.title,
    content: `${documentData.title} ${documentData.fileName} ${documentData.description || ''}`,
    metadata: {
      category: documentData.category,
      status: documentData.status,
      caseId: documentData.caseId,
      isConfidential: documentData.isConfidential,
      lastModified: documentData.updatedAt
    },
    tags: documentData.tags || [],
    lastModified: new Date(documentData.updatedAt)
  })
}

export function indexUser(userData: any): void {
  searchEngine.addToIndex({
    id: userData.id,
    type: 'user',
    title: userData.name,
    content: `${userData.name} ${userData.email} ${userData.title || ''} ${userData.department || ''}`,
    metadata: {
      role: userData.role,
      department: userData.department,
      status: userData.status,
      lastModified: userData.updatedAt
    },
    tags: [userData.role, userData.department].filter(Boolean),
    lastModified: new Date(userData.updatedAt || userData.createdAt)
  })
}

export function indexFOILRequest(foilData: any): void {
  searchEngine.addToIndex({
    id: foilData.id,
    type: 'foil',
    title: foilData.requestNumber,
    content: `${foilData.requestNumber} ${foilData.requesterName} ${foilData.description} ${foilData.specificDocuments || ''}`,
    metadata: {
      status: foilData.status,
      requestType: foilData.requestType,
      requesterName: foilData.requesterName,
      urgentRequest: foilData.urgentRequest,
      lastModified: foilData.updatedAt
    },
    tags: [foilData.requestType, foilData.status].filter(Boolean),
    lastModified: new Date(foilData.updatedAt || foilData.submittedAt)
  })
}

// Bulk index operations
export function bulkIndex(items: any[], type: 'case' | 'document' | 'user' | 'foil'): void {
  items.forEach(item => {
    switch (type) {
      case 'case':
        indexCase(item)
        break
      case 'document':
        indexDocument(item)
        break
      case 'user':
        indexUser(item)
        break
      case 'foil':
        indexFOILRequest(item)
        break
    }
  })
}

// Initialize search index from API
export async function initializeSearchIndex(): Promise<void> {
  try {
    // Clear existing index
    searchEngine.clearIndex()

    // Fetch and index all data
    const [cases, documents, users, foilRequests] = await Promise.allSettled([
      fetch('/api/cases').then(r => r.json()),
      fetch('/api/documents').then(r => r.json()),
      fetch('/api/users').then(r => r.json()),
      fetch('/api/foil').then(r => r.json())
    ])

    if (cases.status === 'fulfilled') {
      bulkIndex(cases.value.cases || cases.value, 'case')
    }

    if (documents.status === 'fulfilled') {
      bulkIndex(documents.value.documents || documents.value, 'document')
    }

    if (users.status === 'fulfilled') {
      bulkIndex(users.value.users || users.value, 'user')
    }

    if (foilRequests.status === 'fulfilled') {
      bulkIndex(foilRequests.value.requests || foilRequests.value, 'foil')
    }

    console.log('Search index initialized:', searchEngine.getStats())
  } catch (error) {
    console.error('Failed to initialize search index:', error)
  }
}

// React hook for search
import { useState, useEffect, useMemo, useCallback } from 'react'
import { cache, CacheKeys } from './cache'

export function useSearch(query: string, options: SearchOptions = {}) {
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [suggestions, setSuggestions] = useState<string[]>([])

  const debouncedQuery = useMemo(() => {
    const timeoutId = setTimeout(() => query, 300)
    return () => clearTimeout(timeoutId)
  }, [query])

  const performSearch = useCallback(async () => {
    if (!query.trim()) {
      setResults([])
      return
    }

    setLoading(true)

    try {
      // Try cache first
      const cacheKey = CacheKeys.SEARCH(query, options.types?.join(','))
      const cached = cache.get<SearchResult[]>(cacheKey)
      
      if (cached) {
        setResults(cached)
        setLoading(false)
        return
      }

      // Perform search
      const searchResults = searchEngine.search(query, options)
      
      // Cache results for 5 minutes
      cache.set(cacheKey, searchResults, 5 * 60 * 1000)
      setResults(searchResults)
    } catch (error) {
      console.error('Search failed:', error)
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [query, options])

  const getSuggestions = useCallback(() => {
    if (query.length >= 2) {
      const searchSuggestions = searchEngine.getSuggestions(query)
      setSuggestions(searchSuggestions)
    } else {
      setSuggestions([])
    }
  }, [query])

  useEffect(() => {
    performSearch()
  }, [performSearch])

  useEffect(() => {
    getSuggestions()
  }, [getSuggestions])

  return {
    results,
    loading,
    suggestions,
    stats: searchEngine.getStats()
  }
}