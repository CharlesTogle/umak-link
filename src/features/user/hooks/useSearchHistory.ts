import { useState, useEffect, useCallback } from 'react'
import { Capacitor } from '@capacitor/core'
import { Preferences } from '@capacitor/preferences'

const SEARCH_HISTORY_KEY = 'SearchHistory'
const MAX_HISTORY_ITEMS = 10

// Hybrid storage utility
const storage = {
  async get (key: string): Promise<string | null> {
    if (Capacitor.isNativePlatform()) {
      const { value } = await Preferences.get({ key })
      return value ?? null
    }
    return localStorage.getItem(key)
  },
  async set (key: string, value: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      await Preferences.set({ key, value })
      return
    }
    localStorage.setItem(key, value)
  }
}

export function useSearchHistory () {
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  // Load search history from storage on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const raw = await storage.get(SEARCH_HISTORY_KEY)
        if (raw) {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) {
            setSearchHistory(parsed)
          }
        }
      } catch (error) {
        console.error('Failed to load search history:', error)
      } finally {
        setIsLoaded(true)
      }
    }
    loadHistory()
  }, [])

  // Save search history to storage whenever it changes
  useEffect(() => {
    if (!isLoaded) return // Don't save until we've loaded initial data

    const saveHistory = async () => {
      try {
        await storage.set(SEARCH_HISTORY_KEY, JSON.stringify(searchHistory))
      } catch (error) {
        console.error('Failed to save search history:', error)
      }
    }
    saveHistory()
  }, [searchHistory, isLoaded])

  // Add a search term to history
  const addToHistory = useCallback((term: string) => {
    if (!term.trim()) return

    setSearchHistory(prev => {
      // Remove duplicates and add to front
      const filtered = prev.filter(
        item => item.toLowerCase() !== term.toLowerCase()
      )
      const newHistory = [term, ...filtered]
      // Limit to MAX_HISTORY_ITEMS
      return newHistory.slice(0, MAX_HISTORY_ITEMS)
    })
  }, [])

  // Remove a specific term from history
  const removeFromHistory = useCallback((term: string) => {
    setSearchHistory(prev => prev.filter(item => item !== term))
  }, [])

  // Clear all search history
  const clearHistory = useCallback(() => {
    setSearchHistory([])
  }, [])

  return {
    searchHistory,
    setSearchHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    isLoaded
  }
}
