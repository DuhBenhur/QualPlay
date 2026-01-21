// ============================================================================
// QUALPLAY - SEARCH CONTEXT PROVIDER
// ============================================================================
// Context para rastrear estado de busca e fornecer contexto para logging
// ============================================================================

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react'

export interface SearchContextData {
    query: string
    movieNames: string[]
    directorNames: string[]
    filters: {
        genres: number[]
        yearStart: number
        yearEnd: number
        sortBy: string
        region: string
    }
    resultCount: number
    searchTimestamp: string | null
}

interface SearchContextValue {
    searchContext: SearchContextData
    updateSearchContext: (data: Partial<SearchContextData>) => void
    getLoggingContext: (movieId: number, position?: number) => SearchLoggingContext
    clearSearchContext: () => void
}

export interface SearchLoggingContext {
    page: string
    search_query?: string
    filter_genres?: number[]
    result_position?: number
    result_count?: number
    search_timestamp?: string
    source?: string
}

const defaultSearchContext: SearchContextData = {
    query: '',
    movieNames: [],
    directorNames: [],
    filters: {
        genres: [],
        yearStart: 1950,
        yearEnd: new Date().getFullYear(),
        sortBy: 'popularity.desc',
        region: 'BR'
    },
    resultCount: 0,
    searchTimestamp: null
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined)

interface SearchContextProviderProps {
    children: ReactNode
}

export const SearchContextProvider: React.FC<SearchContextProviderProps> = ({ children }) => {
    const [searchContext, setSearchContext] = useState<SearchContextData>(defaultSearchContext)

    const updateSearchContext = useCallback((data: Partial<SearchContextData>) => {
        setSearchContext(prev => ({
            ...prev,
            ...data,
            searchTimestamp: new Date().toISOString()
        }))
    }, [])

    const clearSearchContext = useCallback(() => {
        setSearchContext(defaultSearchContext)
    }, [])

    const getLoggingContext = useCallback((position?: number): SearchLoggingContext => {
        const context: SearchLoggingContext = {
            page: 'search_results'
        }

        if (searchContext.query || searchContext.movieNames.length > 0 || searchContext.directorNames.length > 0) {
            context.search_query = searchContext.query ||
                [...searchContext.movieNames, ...searchContext.directorNames].join(', ')
        }

        if (searchContext.filters.genres.length > 0) {
            context.filter_genres = searchContext.filters.genres
        }

        if (position !== undefined) {
            context.result_position = position
        }

        if (searchContext.resultCount > 0) {
            context.result_count = searchContext.resultCount
        }

        if (searchContext.searchTimestamp) {
            context.search_timestamp = searchContext.searchTimestamp
        }

        return context
    }, [searchContext])

    return (
        <SearchContext.Provider value={{
            searchContext,
            updateSearchContext,
            getLoggingContext,
            clearSearchContext
        }}>
            {children}
        </SearchContext.Provider>
    )
}

export const useSearchContext = (): SearchContextValue => {
    const context = useContext(SearchContext)
    if (!context) {
        throw new Error('useSearchContext must be used within a SearchContextProvider')
    }
    return context
}

// Hook opcional para uso sem Provider (fallback seguro)
export const useSearchContextSafe = (): SearchContextValue | null => {
    return useContext(SearchContext) || null
}

export default SearchContext
