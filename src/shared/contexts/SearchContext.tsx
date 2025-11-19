import React, { createContext, useCallback, useContext, useState } from 'react'

type SearchContextType = {
  searchResultPostIds: string[]
  setSearchResults: (postIds: string[]) => void
  addSearchResult: (postId: string) => void
  removeSearchResult: (postId: string) => void
  clearSearchResults: () => void
  hasPostId: (postId: string) => boolean
}

const SearchContext = createContext<SearchContextType | undefined>(undefined)

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const [searchResultPostIds, setSearchResultPostIds] = useState<string[]>([])

  const setSearchResults = useCallback((postIds: string[]) => {
    setSearchResultPostIds(postIds)
  }, [])

  const addSearchResult = useCallback((postId: string) => {
    setSearchResultPostIds(prev =>
      prev.includes(postId) ? prev : [...prev, postId]
    )
  }, [])

  const removeSearchResult = useCallback((postId: string) => {
    setSearchResultPostIds(prev => prev.filter(id => id !== postId))
  }, [])

  const clearSearchResults = useCallback(() => {
    setSearchResultPostIds([])
  }, [])

  const hasPostId = useCallback(
    (postId: string) => {
      return searchResultPostIds.includes(postId)
    },
    [searchResultPostIds]
  )

  return (
    <SearchContext.Provider
      value={{
        searchResultPostIds,
        setSearchResults,
        addSearchResult,
        removeSearchResult,
        clearSearchResults,
        hasPostId
      }}
    >
      {children}
    </SearchContext.Provider>
  )
}

export function useSearchContext (): SearchContextType {
  const ctx = useContext(SearchContext)
  if (!ctx)
    throw new Error('useSearchContext must be used within SearchProvider')
  return ctx
}

export default SearchContext
