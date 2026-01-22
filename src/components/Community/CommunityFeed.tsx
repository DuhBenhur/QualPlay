// ============================================================================
// QUALPLAY - COMMUNITY FEED COMPONENT
// ============================================================================
// Feed de atividades recentes da comunidade
// ============================================================================

import React, { useEffect, useState } from 'react'
import { Star, MessageCircle, Heart, Clock, Film, User, Sparkles, Search } from 'lucide-react'
import { getCommunityFeed, CommunityActivity } from '../../services/interactionService'
import { getImageUrl, getMovieDetails } from '../../services/tmdbApi'

interface CommunityFeedProps {
    onMovieClick?: (movieId: number) => void
    limit?: number
}

const CommunityFeed: React.FC<CommunityFeedProps> = ({ onMovieClick, limit = 20 }) => {
    const [activities, setActivities] = useState<CommunityActivity[]>([])
    const [movieData, setMovieData] = useState<Record<number, { title: string; poster: string }>>({})
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        loadFeed()
    }, [limit])

    const loadFeed = async () => {
        setLoading(true)
        setError(null)

        try {
            // Timeout de 3 segundos
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout')), 3000)
            )

            const fetchFeed = async () => {
                const { data, error: feedError } = await getCommunityFeed(limit)
                if (feedError) throw feedError
                return data
            }

            const data = await Promise.race([fetchFeed(), timeout]) as CommunityActivity[]

            if (!data || data.length === 0) {
                setActivities([])
                setLoading(false)
                return
            }

            setActivities(data)

            // Carregar dados dos filmes
            const movieIds = [...new Set(data.map(a => a.movie_id))]
            const movieInfo: Record<number, { title: string; poster: string }> = {}

            // Carregar filmes em paralelo para ser mais rápido
            await Promise.all(movieIds.map(async (movieId) => {
                try {
                    const movie = await getMovieDetails(movieId)
                    if (movie) {
                        movieInfo[movieId] = {
                            title: movie.title,
                            poster: movie.poster_path || ''
                        }
                    } else {
                        movieInfo[movieId] = { title: `Filme #${movieId}`, poster: '' }
                    }
                } catch {
                    movieInfo[movieId] = { title: `Filme #${movieId}`, poster: '' }
                }
            }))

            setMovieData(movieInfo)
        } catch (err) {
            console.error('Erro ao carregar feed:', err)
            setError('Não foi possível carregar o feed. Tente novamente.')
            // Se der erro, pelo menos limpa o loading
        } finally {
            setLoading(false)
        }
    }

    const formatTimeAgo = (dateString: string): string => {
        const date = new Date(dateString)
        const now = new Date()
        const diffMs = now.getTime() - date.getTime()
        const diffMins = Math.floor(diffMs / 60000)
        const diffHours = Math.floor(diffMs / 3600000)
        const diffDays = Math.floor(diffMs / 86400000)

        if (diffMins < 1) return 'agora'
        if (diffMins < 60) return `${diffMins}m atrás`
        if (diffHours < 24) return `${diffHours}h atrás`
        if (diffDays < 7) return `${diffDays}d atrás`
        return date.toLocaleDateString('pt-BR')
    }

    const renderStars = (score: number) => {
        return (
            <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map(s => (
                    <Star
                        key={s}
                        size={14}
                        className={s <= score ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'}
                    />
                ))}
            </div>
        )
    }

    if (loading) {
        return (
            <div className="space-y-4 py-4">
                {/* Loading Skeleton */}
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 animate-pulse">
                        <div className="flex gap-4">
                            <div className="w-14 h-20 bg-slate-700 rounded" />
                            <div className="flex-1 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-slate-700 rounded-full" />
                                    <div className="h-4 w-32 bg-slate-700 rounded" />
                                </div>
                                <div className="h-4 w-full bg-slate-700 rounded" />
                                <div className="h-4 w-2/3 bg-slate-700 rounded" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-400">{error}</p>
                <button
                    onClick={loadFeed}
                    className="mt-4 text-blue-400 hover:text-blue-300"
                >
                    Tentar novamente
                </button>
            </div>
        )
    }

    if (activities.length === 0) {
        return (
            <div className="text-center py-12">
                <div className="relative inline-block mb-6">
                    <Film size={64} className="mx-auto text-slate-600" />
                    <Sparkles className="absolute -top-2 -right-2 text-blue-400" size={24} />
                </div>

                <h3 className="text-2xl font-bold text-white mb-3">
                    🎬 Seja o Primeiro!
                </h3>

                <p className="text-slate-300 mb-2 max-w-sm mx-auto">
                    Ainda não há atividades para exibir.
                </p>
                <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                    Avalie um filme agora e mostre para a comunidade o que você está assistindo!
                </p>

                {/* CTA */}
                <button
                    onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg shadow-blue-500/25 font-medium"
                >
                    <Search size={18} />
                    Avaliar Meu Primeiro Filme
                </button>

                {/* Insight */}
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg max-w-md mx-auto">
                    <p className="text-blue-300 text-sm">
                        💡 Sua avaliação será vista por outros cinéfilos e ajudará a criar recomendações melhores!
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {activities.map((activity, index) => {
                const movie = movieData[activity.movie_id]

                return (
                    <div
                        key={`${activity.type}-${activity.movie_id}-${index}`}
                        className="bg-slate-800/50 rounded-lg p-4 border border-slate-700/50 hover:border-slate-600 transition-colors"
                    >
                        <div className="flex gap-4">
                            {/* Movie Poster */}
                            <button
                                onClick={() => onMovieClick?.(activity.movie_id)}
                                className="flex-shrink-0 hover:opacity-80 transition-opacity"
                            >
                                <img
                                    src={movie?.poster ? getImageUrl(movie.poster, 'w92') : '/placeholder-movie.jpg'}
                                    alt={movie?.title || 'Filme'}
                                    className="w-14 h-20 object-cover rounded"
                                />
                            </button>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* User Info */}
                                <div className="flex items-center gap-2 mb-2">
                                    {activity.user?.avatar_url ? (
                                        <img
                                            src={activity.user.avatar_url}
                                            alt={activity.user.full_name || 'Usuário'}
                                            className="w-6 h-6 rounded-full"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-slate-600 flex items-center justify-center">
                                            <User size={14} className="text-slate-400" />
                                        </div>
                                    )}
                                    <span className="text-white font-medium text-sm truncate">
                                        {activity.user?.full_name || 'Usuário'}
                                    </span>
                                    <span className="text-slate-500 text-xs flex items-center gap-1">
                                        <Clock size={12} />
                                        {formatTimeAgo(activity.created_at)}
                                    </span>
                                </div>

                                {/* Activity Content */}
                                <button
                                    onClick={() => onMovieClick?.(activity.movie_id)}
                                    className="text-left hover:text-blue-400 transition-colors"
                                >
                                    <span className="text-slate-300 font-medium">
                                        {movie?.title || `Filme #${activity.movie_id}`}
                                    </span>
                                </button>

                                {/* Activity Type */}
                                <div className="mt-2">
                                    {activity.type === 'rating' && activity.score && (
                                        <div className="flex items-center gap-2">
                                            {renderStars(activity.score)}
                                            <span className="text-slate-400 text-sm">
                                                avaliou com {activity.score} estrela{activity.score > 1 ? 's' : ''}
                                            </span>
                                        </div>
                                    )}

                                    {activity.type === 'review' && activity.content && (
                                        <div className="flex items-start gap-2">
                                            <MessageCircle size={16} className="text-blue-400 mt-0.5 flex-shrink-0" />
                                            <p className="text-slate-300 text-sm line-clamp-2">
                                                "{activity.content}"
                                            </p>
                                        </div>
                                    )}

                                    {activity.type === 'like' && (
                                        <div className="flex items-center gap-2">
                                            <Heart size={16} className="text-red-400 fill-red-400" />
                                            <span className="text-slate-400 text-sm">curtiu este filme</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default CommunityFeed
