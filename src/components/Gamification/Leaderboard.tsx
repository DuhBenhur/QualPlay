// ============================================================================
// QUALPLAY - LEADERBOARD COMPONENT
// ============================================================================

import React, { useEffect, useState } from 'react'
import { Trophy, Medal, Crown, Star, Users, Sparkles, Search } from 'lucide-react'
import { getLeaderboard, LeaderboardEntry, getLevelFromPoints } from '../../services/gamificationService'
import { useAuth } from '../../contexts/AuthContext'
import ShareButton from '../ShareButton'

interface LeaderboardProps {
    limit?: number
    onNavigate?: (page: 'home' | 'about' | 'contact' | 'community') => void
}

const Leaderboard: React.FC<LeaderboardProps> = ({ limit = 10, onNavigate }) => {
    const { user } = useAuth()
    const [entries, setEntries] = useState<LeaderboardEntry[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadLeaderboard()
    }, [limit])

    const loadLeaderboard = async () => {
        setLoading(true)
        const data = await getLeaderboard(limit)
        setEntries(data)
        setLoading(false)
    }

    const getRankIcon = (rank: number) => {
        switch (rank) {
            case 1:
                return <Crown className="text-yellow-400" size={24} />
            case 2:
                return <Medal className="text-slate-300" size={22} />
            case 3:
                return <Medal className="text-orange-400" size={20} />
            default:
                return (
                    <span className="w-6 h-6 flex items-center justify-center text-slate-400 font-bold">
                        {rank}
                    </span>
                )
        }
    }

    const getRankBackground = (rank: number): string => {
        switch (rank) {
            case 1:
                return 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/30'
            case 2:
                return 'bg-slate-700/50 border-slate-500/30'
            case 3:
                return 'bg-orange-900/20 border-orange-500/30'
            default:
                return 'bg-slate-800/30 border-slate-700/30'
        }
    }

    if (loading) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="text-yellow-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Ranking do Mês</h2>
                    <span className="ml-auto text-slate-400 text-sm">Top {limit}</span>
                </div>

                {/* Loading Skeleton */}
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 border border-slate-700/30 animate-pulse">
                            <div className="w-8 h-8 bg-slate-700 rounded-full" />
                            <div className="w-10 h-10 bg-slate-700 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 bg-slate-700 rounded w-32" />
                                <div className="h-3 bg-slate-700 rounded w-24" />
                            </div>
                            <div className="w-16 h-4 bg-slate-700 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    if (entries.length === 0) {
        return (
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-6">
                    <Trophy className="text-yellow-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Ranking do Mês</h2>
                    <span className="ml-auto text-slate-400 text-sm">Top {limit}</span>
                </div>

                {/* Empty State Inspirador */}
                <div className="text-center py-8">
                    <div className="relative inline-block mb-6">
                        <Users className="mx-auto text-slate-600" size={64} />
                        <Sparkles className="absolute -top-2 -right-2 text-yellow-400" size={24} />
                    </div>

                    <h3 className="text-2xl font-bold text-white mb-3">
                        👥 Seja um Pioneiro!
                    </h3>

                    <p className="text-slate-300 mb-2 max-w-sm mx-auto">
                        A comunidade está apenas começando.
                    </p>
                    <p className="text-slate-400 text-sm mb-6 max-w-sm mx-auto">
                        Avalie filmes e seja um dos primeiros a aparecer no ranking!
                    </p>

                    {/* CTAs */}
                    <div className="space-y-3">
                        <ShareButton className="w-full justify-center" />

                        <button
                            onClick={() => {
                                if (onNavigate) {
                                    onNavigate('home');
                                } else {
                                    // Fallback: scroll to top para ir para busca
                                    window.scrollTo({ top: 0, behavior: 'smooth' });
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors font-medium"
                        >
                            <Search size={18} />
                            Começar a Avaliar
                        </button>
                    </div>

                    {/* Insight */}
                    <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                        <p className="text-blue-300 text-sm">
                            💡 <strong>Convide amigos</strong> para competirem com você e tornarem a experiência ainda mais divertida!
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Trophy className="text-yellow-400" size={24} />
                    <h2 className="text-xl font-bold text-white">Ranking do Mês</h2>
                </div>
                <span className="text-slate-400 text-sm">Top {limit}</span>
            </div>

            <div className="space-y-3">
                {entries.map((entry) => {
                    const level = getLevelFromPoints(entry.total_points)
                    const isCurrentUser = user?.id === entry.user_id

                    return (
                        <div
                            key={entry.user_id}
                            className={`
                                flex items-center gap-4 p-3 rounded-xl border transition-all
                                ${getRankBackground(entry.rank)}
                                ${isCurrentUser ? 'ring-2 ring-blue-500/50' : ''}
                            `}
                        >
                            {/* Rank */}
                            <div className="w-8 flex justify-center">
                                {getRankIcon(entry.rank)}
                            </div>

                            {/* Level Badge */}
                            <div
                                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
                                style={{ backgroundColor: level.color }}
                            >
                                {level.level}
                            </div>

                            {/* User Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-400' : 'text-white'}`}>
                                        {entry.display_name}
                                        {isCurrentUser && ' (você)'}
                                    </span>
                                </div>
                                <div className="text-slate-400 text-sm">
                                    {level.title}
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="text-right">
                                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                                    <Star size={14} />
                                    {entry.total_points.toLocaleString()}
                                </div>
                                <div className="text-slate-500 text-xs">
                                    {entry.badges_count} badges
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default Leaderboard
