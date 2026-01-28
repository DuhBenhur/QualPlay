// ============================================================================
// QUALPLAY - COMMUNITY PAGE
// ============================================================================
// Página de comunidade mostrando atividades públicas de outros usuários
// ============================================================================

import React, { useEffect, useState } from 'react'
import {
    Users, TrendingUp, Star, MessageCircle, Film,
    Activity, Award, Sparkles, ArrowRight, RefreshCw, Eye, EyeOff, X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import CommunityFeed from './Community/CommunityFeed'
import { supabase } from '../lib/supabase'
import { getImageUrl, getMovieDetails } from '../services/tmdbApi'
import { UserLevel, UserBadges, UserStreak, Leaderboard } from './Gamification'
import UserMovieStats from './UserMovieStats'
import {
    getUserGamification,
    initializeUserGamification,
    updateProfileVisibility,
    UserGamification
} from '../services/gamificationService'

interface CommunityStats {
    totalRatings: number
    totalReviews: number
    activeUsers: number
    topRatedMovieId: number | null
}

interface TrendingMovie {
    movie_id: number
    title: string
    poster_path: string | null
    rating_count: number
    avg_rating: number
}

interface CommunityPageProps {
    onMovieClick: (movieId: number) => void
    onLogin?: () => void
    onNavigate?: (page: 'home' | 'about' | 'contact' | 'community') => void
}

const CommunityPage: React.FC<CommunityPageProps> = ({ onMovieClick, onLogin, onNavigate }) => {
    const { user } = useAuth()
    const [stats, setStats] = useState<CommunityStats>({
        totalRatings: 0,
        totalReviews: 0,
        activeUsers: 0,
        topRatedMovieId: null
    })
    const [trendingMovies, setTrendingMovies] = useState<TrendingMovie[]>([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)
    const [userGamification, setUserGamification] = useState<UserGamification | null>(null)
    const [showAllBadges, setShowAllBadges] = useState(false)

    useEffect(() => {
        const init = async () => {
            await loadCommunityData()
            // Carregar gamificação em paralelo, sem delay
            if (user) {
                loadUserGamification()
            }
        }
        init()

        // Realtime updates listener
        const handleGamificationUpdate = () => {
            console.log('[CommunityPage] Gamification update received, refreshing...')
            loadUserGamification()
        }

        window.addEventListener('gamificationUpdated', handleGamificationUpdate)

        return () => {
            window.removeEventListener('gamificationUpdated', handleGamificationUpdate)
        }
    }, [user]) // Re-run if user changes (login/logout)


    const loadCommunityData = async () => {
        setLoading(true)
        try {
            // Executar em PARALELO para carregar mais rápido
            await Promise.all([
                loadStats(),
                loadTrendingMovies()
            ])
        } catch (e) {
            console.error(e)
        } finally {
            setLoading(false)
        }
    }

    const loadUserGamification = async () => {
        if (!user) return
        try {
            // First try to get current state
            let gamification = await getUserGamification(user.id)
            if (!gamification) {
                gamification = await initializeUserGamification(user.id)
            }

            // Trigger background sync to fix retroactive badges
            // This runs without blocking the UI
            const { syncUserGamification } = await import('../services/gamificationService')
            syncUserGamification(user.id).then(updated => {
                if (updated) setUserGamification(updated)
            })

            setUserGamification(gamification)
        } catch (error) {
            console.error('Erro ao carregar gamificação:', error)
        }
    }

    const handleToggleProfileVisibility = async () => {
        if (!user || !userGamification) return
        const newVisibility = !userGamification.is_profile_public
        const success = await updateProfileVisibility(user.id!, newVisibility)
        if (success) {
            setUserGamification({ ...userGamification, is_profile_public: newVisibility })
        }
    }

    const handleRefresh = async () => {
        setRefreshing(true)
        await loadCommunityData()
        if (user) await loadUserGamification()
        setRefreshing(false)
    }

    const loadStats = async () => {
        if (!supabase) {
            // Se não há Supabase, usar valores padrão
            setStats({
                totalRatings: 0,
                totalReviews: 0,
                activeUsers: 0,
                topRatedMovieId: null
            })
            return
        }

        try {
            // Timeout de 5 segundos para mostrar erro mais rapidamente
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao carregar estatísticas')), 5000)
            )

            const fetchData = async () => {
                // Contagem de ratings
                const ratingsPromise = supabase
                    .from('ratings')
                    .select('*', { count: 'exact', head: true })

                // Contagem de reviews
                const reviewsPromise = (supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true }) as any)
                    .is('parent_id', null)

                // Usuários ativos
                const usersPromise = supabase
                    .from('ratings')
                    .select('user_id')

                const [ratingsRes, reviewsRes, usersRes] = await Promise.all([
                    ratingsPromise,
                    reviewsPromise,
                    usersPromise
                ])

                const uniqueUsers = new Set(((usersRes as any).data as any[] || []).map((r: any) => r.user_id))

                return {
                    totalRatings: (ratingsRes as any).count || 0,
                    totalReviews: (reviewsRes as any).count || 0,
                    activeUsers: uniqueUsers.size,
                    topRatedMovieId: null
                }
            }

            const stats = await Promise.race([fetchData(), timeout])
            setStats(stats as CommunityStats)
        } catch (error) {
            console.error('Error loading community stats:', error)
            // Definir valores padrão em caso de erro
            setStats({
                totalRatings: 0,
                totalReviews: 0,
                activeUsers: 0,
                topRatedMovieId: null
            })
        }
    }

    const loadTrendingMovies = async () => {
        if (!supabase) {
            setTrendingMovies([])
            return
        }

        try {
            // Timeout de 5 segundos para consistência
            const timeout = new Promise<never>((_, reject) =>
                setTimeout(() => reject(new Error('Timeout ao carregar filmes em alta')), 5000)
            )

            const fetchTrending = async () => {
                // Buscar filmes mais avaliados recentemente (últimos 7 dias)
                const weekAgo = new Date()
                weekAgo.setDate(weekAgo.getDate() - 7)

                const { data: ratings } = await (supabase
                    .from('ratings')
                    .select('movie_id, score') as any)
                    .gte('created_at', weekAgo.toISOString())

                if (!ratings || ratings.length === 0) {
                    return []
                }

                // Agregar por filme
                const movieStats: Record<number, { count: number; totalScore: number }> = {}
                ratings.forEach((r: any) => {
                    if (!movieStats[r.movie_id]) {
                        movieStats[r.movie_id] = { count: 0, totalScore: 0 }
                    }
                    movieStats[r.movie_id].count++
                    movieStats[r.movie_id].totalScore += r.score
                })

                // Top 5 filmes
                const topMovieIds = Object.entries(movieStats)
                    .sort((a, b) => b[1].count - a[1].count)
                    .slice(0, 5)
                    .map(([id, stats]) => ({
                        movie_id: parseInt(id),
                        rating_count: stats.count,
                        avg_rating: stats.totalScore / stats.count
                    }))

                // Carregar detalhes dos filmes
                const moviesWithDetails: TrendingMovie[] = []
                for (const movie of topMovieIds) {
                    try {
                        const details = await getMovieDetails(movie.movie_id)
                        if (details) {
                            moviesWithDetails.push({
                                movie_id: movie.movie_id,
                                title: details.title,
                                poster_path: details.poster_path,
                                rating_count: movie.rating_count,
                                avg_rating: movie.avg_rating
                            })
                        }
                    } catch (error) {
                        console.error(`Error loading movie ${movie.movie_id}:`, error)
                    }
                }

                return moviesWithDetails
            }

            const movies = await Promise.race([fetchTrending(), timeout])
            setTrendingMovies(movies as TrendingMovie[])
        } catch (error) {
            console.error('Error loading trending movies:', error)
            setTrendingMovies([])
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-white text-lg">Carregando comunidade...</span>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-900 pb-12">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-pink-600/20" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/30 via-transparent to-transparent" />

                {/* Animated background elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute top-40 right-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />

                <div className="relative max-w-7xl mx-auto px-6 py-16">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg shadow-blue-500/25">
                                <Users className="text-white" size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-bold text-white">
                                    Comunidade QualPlay
                                </h1>
                                <p className="text-slate-400 mt-1">
                                    Descubra o que outros cinéfilos estão assistindo
                                </p>
                            </div>
                        </div>

                        <button
                            onClick={handleRefresh}
                            disabled={refreshing}
                            className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors disabled:opacity-50"
                        >
                            <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
                            Atualizar
                        </button>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-yellow-500/20 rounded-xl">
                                    <Star className="text-yellow-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {stats.totalRatings.toLocaleString()}
                                    </div>
                                    <div className="text-slate-400">Avaliações</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-500/20 rounded-xl">
                                    <MessageCircle className="text-purple-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {stats.totalReviews.toLocaleString()}
                                    </div>
                                    <div className="text-slate-400">Reviews</div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:border-green-500/50 transition-colors">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-500/20 rounded-xl">
                                    <Activity className="text-green-400" size={24} />
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-white">
                                        {stats.activeUsers.toLocaleString()}
                                    </div>
                                    <div className="text-slate-400">Usuários Ativos</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* User Statistics - Only for logged in users */}
            {user && (
                <div className="max-w-7xl mx-auto px-6 mt-8">
                    <UserMovieStats onNavigate={onNavigate} />
                </div>
            )}

            <div className="max-w-7xl mx-auto px-6 mt-12">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Feed */}
                    <div className="lg:col-span-2">
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <Sparkles className="text-blue-400" size={24} />
                                <h2 className="text-xl font-bold text-white">
                                    Atividade Recente
                                </h2>
                            </div>

                            <CommunityFeed
                                onMovieClick={onMovieClick}
                                limit={15}
                            />
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        {/* Trending Movies */}
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <TrendingUp className="text-orange-400" size={24} />
                                <h2 className="text-xl font-bold text-white">
                                    Em Alta
                                </h2>
                            </div>

                            {trendingMovies.length > 0 ? (
                                <div className="space-y-4">
                                    {trendingMovies.map((movie, index) => (
                                        <button
                                            key={movie.movie_id}
                                            onClick={() => onMovieClick(movie.movie_id)}
                                            className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-700/50 transition-colors text-left"
                                        >
                                            <span className={`
                                                w-6 h-6 flex items-center justify-center rounded-full text-sm font-bold
                                                ${index === 0 ? 'bg-yellow-500 text-black' :
                                                    index === 1 ? 'bg-slate-400 text-black' :
                                                        index === 2 ? 'bg-orange-600 text-white' :
                                                            'bg-slate-600 text-white'}
                                            `}>
                                                {index + 1}
                                            </span>

                                            <img
                                                src={movie.poster_path ? getImageUrl(movie.poster_path, 'w92') : '/placeholder-movie.jpg'}
                                                alt={movie.title}
                                                className="w-10 h-14 object-cover rounded"
                                            />

                                            <div className="flex-1 min-w-0">
                                                <div className="text-white font-medium truncate">
                                                    {movie.title}
                                                </div>
                                                <div className="flex items-center gap-2 text-slate-400 text-sm">
                                                    <Star size={12} className="text-yellow-400 fill-current" />
                                                    {movie.avg_rating.toFixed(1)}
                                                    <span className="text-slate-500">•</span>
                                                    {movie.rating_count} avaliações
                                                </div>
                                            </div>

                                            <ArrowRight size={16} className="text-slate-500" />
                                        </button>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Film size={32} className="mx-auto text-slate-600 mb-2" />
                                    <p className="text-slate-400 text-sm">
                                        Nenhum filme em alta ainda
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Call to Action */}
                        {!user && (
                            <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl p-6 text-center">
                                <Award className="mx-auto text-white mb-4" size={40} />
                                <h3 className="text-xl font-bold text-white mb-2">
                                    Participe da Comunidade
                                </h3>
                                <p className="text-blue-100 text-sm mb-4">
                                    Faça login para avaliar filmes, escrever reviews e aparecer no feed!
                                </p>
                                <button
                                    onClick={onLogin}
                                    className="w-full px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                                >
                                    Entrar na Comunidade
                                </button>
                            </div>
                        )}

                        {/* User Gamification Profile (Logged In Only) */}
                        {user && userGamification && (
                            <div className="space-y-4">
                                {/* Level Card */}
                                <UserLevel points={userGamification.total_points} />

                                {/* Streak Card */}
                                <UserStreak
                                    currentStreak={userGamification.current_streak}
                                    longestStreak={userGamification.longest_streak}
                                />

                                {/* Badges Preview with Modal Trigger */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-white font-bold flex items-center gap-2">
                                            <Award className="text-yellow-400" size={20} />
                                            Suas Conquistas
                                        </h3>
                                        <button
                                            onClick={() => setShowAllBadges(true)}
                                            className="text-blue-400 text-sm hover:underline"
                                        >
                                            Ver todas
                                        </button>
                                    </div>
                                    <UserBadges
                                        earnedBadges={userGamification.badges_earned || []}
                                        showLocked={false}
                                        compact={true}
                                    />
                                </div>

                                {/* Badges Modal */}
                                {showAllBadges && (
                                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                                        <div className="relative w-full max-w-4xl bg-slate-900 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto">

                                            {/* Close Button */}
                                            <button
                                                onClick={() => setShowAllBadges(false)}
                                                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-800/50 rounded-full hover:bg-slate-700 transition-colors"
                                            >
                                                <X size={24} />
                                            </button>

                                            <div className="text-center mb-8">
                                                <div className="inline-flex items-center justify-center p-3 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-2xl mb-4">
                                                    <Award className="text-yellow-400" size={32} />
                                                </div>
                                                <h2 className="text-3xl font-bold text-white mb-2">Galeria de Conquistas</h2>
                                                <p className="text-slate-400 max-w-md mx-auto">
                                                    Colecione todas as badges avaliando filmes, escrevendo reviews e participando da comunidade!
                                                </p>
                                            </div>

                                            <UserBadges
                                                earnedBadges={userGamification.badges_earned || []}
                                                showLocked={true}
                                                compact={false}
                                            />
                                        </div>
                                    </div>
                                )}

                                {/* Profile Visibility Toggle */}
                                <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            {userGamification.is_profile_public ? (
                                                <Eye className="text-green-400" size={18} />
                                            ) : (
                                                <EyeOff className="text-slate-400" size={18} />
                                            )}
                                            <span className="text-white text-sm">
                                                Perfil {userGamification.is_profile_public ? 'Público' : 'Privado'}
                                            </span>
                                        </div>
                                        <button
                                            onClick={handleToggleProfileVisibility}
                                            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${userGamification.is_profile_public
                                                ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                                                : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                                                }`}
                                        >
                                            {userGamification.is_profile_public ? 'Visível no Ranking' : 'Oculto do Ranking'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Leaderboard */}
                        <Leaderboard limit={5} onNavigate={onNavigate} />

                        {/* Tips */}
                        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                            <h3 className="text-white font-bold mb-4">💡 Dicas</h3>
                            <ul className="space-y-3 text-slate-400 text-sm">
                                <li className="flex items-start gap-2">
                                    <span className="text-blue-400">•</span>
                                    Avalie filmes para ajudar outros descobrir novas obras
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-purple-400">•</span>
                                    Escreva reviews curtos para compartilhar suas impressões
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-green-400">•</span>
                                    Suas avaliações ajudam a melhorar as recomendações
                                </li>
                                <li className="flex items-start gap-2">
                                    <span className="text-yellow-400">•</span>
                                    Ganhe pontos e suba de nível para desbloquear badges!
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CommunityPage
