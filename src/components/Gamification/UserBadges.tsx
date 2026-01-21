// ============================================================================
// QUALPLAY - USER BADGES COMPONENT
// ============================================================================

import React from 'react'
import { Award, Lock } from 'lucide-react'
import { BADGES, Badge, getBadgeTierColor } from '../../services/gamificationService'

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
            <div className="text-center py-4">
                <Award className="mx-auto text-slate-600 mb-2" size={32} />
                <p className="text-slate-400 text-sm">Nenhuma conquista ainda</p>
                <p className="text-slate-500 text-xs">Continue avaliando filmes!</p>
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
                                w-10 h-10 rounded-full flex items-center justify-center text-lg
                                ${isEarned
                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20 border border-yellow-500/50'
                                    : 'bg-slate-800 border border-slate-700 opacity-40'}
                            `}
                            title={`${badge.name}: ${badge.description}`}
                        >
                            {isEarned ? badge.icon : <Lock size={14} className="text-slate-500" />}
                        </div>
                    )
                })}
                {displayBadges.length > 5 && (
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center">
                        <span className="text-slate-400 text-xs">+{displayBadges.length - 5}</span>
                    </div>
                )}
            </div>
        )
    }

    // Group badges by category
    const categories = {
        rating: { title: 'Avaliações', badges: [] as Badge[] },
        review: { title: 'Reviews', badges: [] as Badge[] },
        watching: { title: 'Assistidos', badges: [] as Badge[] },
        streak: { title: 'Persistência', badges: [] as Badge[] },
        special: { title: 'Especiais', badges: [] as Badge[] },
    }

    displayBadges.forEach(badge => {
        categories[badge.category].badges.push(badge)
    })

    return (
        <div className="space-y-6">
            {Object.entries(categories).map(([key, category]) => {
                if (category.badges.length === 0) return null

                return (
                    <div key={key}>
                        <h4 className="text-white font-medium mb-3 text-sm uppercase tracking-wider">
                            {category.title}
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {category.badges.map(badge => {
                                const isEarned = earnedSet.has(badge.id)
                                const tierColor = getBadgeTierColor(badge.tier)

                                return (
                                    <div
                                        key={badge.id}
                                        className={`
                                            relative p-4 rounded-xl border transition-all
                                            ${isEarned
                                                ? 'bg-slate-800/80 border-yellow-500/30 hover:border-yellow-500/50'
                                                : 'bg-slate-900/50 border-slate-700/50 opacity-50'}
                                        `}
                                    >
                                        {badge.tier && isEarned && (
                                            <div
                                                className="absolute -top-1 -right-1 w-4 h-4 rounded-full"
                                                style={{ backgroundColor: tierColor }}
                                            />
                                        )}

                                        <div className="flex items-start gap-3">
                                            <div className={`
                                                w-12 h-12 rounded-lg flex items-center justify-center text-2xl
                                                ${isEarned
                                                    ? 'bg-gradient-to-br from-yellow-500/20 to-orange-500/20'
                                                    : 'bg-slate-800'}
                                            `}>
                                                {isEarned ? badge.icon : <Lock size={20} className="text-slate-600" />}
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <h5 className={`font-medium truncate ${isEarned ? 'text-white' : 'text-slate-500'}`}>
                                                    {badge.name}
                                                </h5>
                                                <p className={`text-xs mt-1 ${isEarned ? 'text-slate-400' : 'text-slate-600'}`}>
                                                    {badge.description}
                                                </p>
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
