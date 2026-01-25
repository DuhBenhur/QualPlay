// ============================================================================
// QUALPLAY - USE USER MOVIE DATA HOOK
// ============================================================================
// Hook React para gerenciar dados do usuário sobre um filme
// Sincron com Supabase e eventos globais
// ============================================================================

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { getUserMovieData, type UserMovieData } from '../services/userMovieService'

export function useUserMovieData(movieId: number) {
    const { user } = useAuth()
    const [data, setData] = useState<UserMovieData>({
        isLiked: false,
        rating: null,
        inMyList: false,
        lists: []
    })
    const [loading, setLoading] = useState(true)

    const loadData = useCallback(async () => {
        if (!user || !movieId) {
            setLoading(false)
            return
        }

        setLoading(true)
        const movieData = await getUserMovieData(user.id, movieId)
        setData(movieData)
        setLoading(false)
    }, [user, movieId])

    useEffect(() => {
        loadData()
    }, [loadData])

    // Escutar eventos globais
    useEffect(() => {
        const handleRatingChanged = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.movieId === movieId) {
                loadData()
            }
        }

        const handleFavoriteChanged = (e: Event) => {
            const customEvent = e as CustomEvent
            if (customEvent.detail?.movieId === movieId) {
                setData(prev => ({
                    ...prev,
                    isLiked: customEvent.detail.isLiked
                }))
            }
        }

        const handleListChanged = () => {
            if (user) {
                loadData()
            }
        }

        window.addEventListener('ratingChanged', handleRatingChanged)
        window.addEventListener('favoriteChanged', handleFavoriteChanged)
        window.addEventListener('myListChanged', handleListChanged)

        return () => {
            window.removeEventListener('ratingChanged', handleRatingChanged)
            window.removeEventListener('favoriteChanged', handleFavoriteChanged)
            window.removeEventListener('myListChanged', handleListChanged)
        }
    }, [movieId, user, loadData])

    return {
        ...data,
        loading,
        refresh: loadData
    }
}
