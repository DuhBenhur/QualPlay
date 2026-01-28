// ============================================================================
// QUALPLAY - USER BADGES COMPONENT
// ============================================================================

import React from 'react'
import { Award, Lock, Star, MessageSquare, Film, Zap, Trophy } from 'lucide-react'
import { BADGES, Badge, getBadgeTierColor } from '../../constants/gamification'

interface UserBadgesProps {
    earnedBadges: string[]
    showLocked?: boolean
    compact?: boolean
}

const UserBadges: React.FC<UserBadgesProps> = ({
    earnedBadges,
    showLocked = false,
    compact = false
}) => {
    const earnedSet = new Set(earnedBadges)

    const displayBadges = showLocked
        ? BADGES
        : BADGES.filter(b => earnedSet.has(b.id))

    if (displayBadges.length === 0 && !showLocked) {
        return (
            <div className="text-center py-8 bg-slate-800/30 rounded-xl border border-slate-700/50">
                <div className="w-16 h-16 bg-slate-800/80 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                    <Lock className="text-slate-600" size={24} />
                </div>
                <p className="text-slate-300 font-medium">Nenhuma conquista desbloqueada</p>
                <p className="text-slate-500 text-sm mt-1">Avalie filmes e escreva reviews para ganhar badges!</p>
            </div>
        )
    }

    if (compact) {
        return (
            <div className="flex flex-wrap gap-2">
                {displayBadges.slice(0, 5).map(badge => {
                    const isEarned = earnedSet.has(badge.id)
                    return (
                        <div
                            key={badge.id}
                            className={`
                                group relative w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300
                                ${isEarned
                                    ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/50 shadow-[0_0_15px_-3px_rgba(99,102,241,0.3)]'
                                    : 'bg-slate-800/50 border border-slate-700/50 opacity-40 grayscale'}
                            `}
                            title={`${badge.name}: ${badge.description}`}
                        >
                            <span className="transform group-hover:scale-110 transition-transform duration-300">
                                {badge.icon}
                            </span>

                            {!isEarned && (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/60 rounded-xl backdrop-blur-[1px]">
                                    <Lock size={12} className="text-slate-400" />
                                </div>
                            )}
                        </div>
                    )
                })}
                {displayBadges.length > 5 && (
                    <div className="w-12 h-12 rounded-xl bg-slate-800/50 border border-slate-700/50 flex items-center justify-center hover:bg-slate-800 transition-colors">
                        <span className="text-slate-400 text-xs font-bold">+{displayBadges.length - 5}</span>
                    </div>
                )}
            </div>
        )
    }

    // Group badges by category
    const categories = {
        rating: { title: 'Avaliações', icon: <Star size={16} className="text-yellow-400" />, badges: [] as Badge[] },
        review: { title: 'Reviews', icon: <MessageSquare size={16} className="text-blue-400" />, badges: [] as Badge[] },
        watching: { title: 'Maratona', icon: <Film size={16} className="text-green-400" />, badges: [] as Badge[] },
        streak: { title: 'Sequência', icon: <Zap size={16} className="text-orange-400" />, badges: [] as Badge[] },
        special: { title: 'Especiais', icon: <Trophy size={16} className="text-purple-400" />, badges: [] as Badge[] },
    }

    displayBadges.forEach(badge => {
        if (categories[badge.category]) {
            categories[badge.category].badges.push(badge)
        }
    })

    return (
        <div className="space-y-8">
            {Object.entries(categories).map(([key, category]) => {
                if (category.badges.length === 0) return null

                return (
                    <div key={key} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center gap-2 mb-4 px-1">
                            <div className="p-1.5 bg-slate-800 rounded-lg">
                                {category.icon}
                            </div>
                            <h4 className="text-slate-200 font-bold text-sm uppercase tracking-wider">
                                {category.title}
                            </h4>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {category.badges.map(badge => {
                                const isEarned = earnedSet.has(badge.id)
                                const tierColor = getBadgeTierColor(badge.tier)

                                return (
                                    <div
                                        key={badge.id}
                                        className={`
                                            group relative overflow-hidden rounded-2xl p-4 transition-all duration-300
                                            ${isEarned
                                                ? 'bg-slate-800/40 border-2 border-green-500/60 shadow-lg shadow-green-500/10 hover:bg-slate-800/60 hover:border-green-500/80'
                                                : 'bg-slate-900/30 border border-slate-800/50 opacity-60'}
                                        `}
                                    >
                                        {/* Background Glow Effect for Earned */}
                                        {isEarned && (
                                            <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 blur-2xl rounded-full pointer-events-none" />
                                        )}

                                        <div className="relative flex items-start gap-4">
                                            {/* Icon Container */}
                                            <div className={`
                                                relative w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner
                                                ${isEarned
                                                    ? 'bg-slate-800 text-white'
                                                    : 'bg-slate-900 text-slate-600 grayscale'}
                                            `}>
                                                <span className="transform group-hover:scale-110 transition-transform duration-300 filter drop-shadow-md">
                                                    {badge.icon}
                                                </span>

                                                {/* Start/Tier Indicator */}
                                                {badge.tier && isEarned && (
                                                    <div
                                                        className="absolute -top-1 -right-1 w-3 h-3 rounded-full border-2 border-slate-800 shadow-sm"
                                                        style={{ backgroundColor: tierColor }}
                                                    />
                                                )}

                                                {/* Lock Overlay */}
                                                {!isEarned && (
                                                    <div className="absolute inset-0 flex items-center justify-center bg-slate-950/40 rounded-2xl backdrop-blur-[1px]">
                                                        <Lock size={16} className="text-slate-500" />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex-1 pt-0.5">
                                                <div className="mb-1">
                                                    <h5 className={`font-bold ${isEarned ? 'text-white' : 'text-slate-500'}`}>
                                                        {badge.name}
                                                    </h5>
                                                </div>
                                                <p className={`text-xs leading-relaxed ${isEarned ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {badge.description}
                                                </p>

                                                {/* Progress Bar (Simulated for unlocked ones or full for earned) */}
                                                {!isEarned && (
                                                    <div className="mt-3 h-1 w-full bg-slate-800 rounded-full overflow-hidden">
                                                        <div className="h-full bg-slate-600 w-0" /> {/* TODO: Add real progress */}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export default UserBadges
