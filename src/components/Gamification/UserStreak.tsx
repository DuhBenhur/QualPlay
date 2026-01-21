// ============================================================================
// QUALPLAY - USER STREAK COMPONENT
// ============================================================================

import React from 'react'
import { Flame, Calendar, Trophy } from 'lucide-react'

interface UserStreakProps {
    currentStreak: number
    longestStreak: number
    compact?: boolean
}

const UserStreak: React.FC<UserStreakProps> = ({
    currentStreak,
    longestStreak,
    compact = false
}) => {
    const getStreakColor = (streak: number): string => {
        if (streak >= 30) return '#F59E0B' // Gold
        if (streak >= 14) return '#EF4444' // Red hot
        if (streak >= 7) return '#F97316' // Orange
        if (streak >= 3) return '#FB923C' // Light orange
        return '#6B7280' // Gray
    }

    const getStreakMessage = (streak: number): string => {
        if (streak >= 30) return 'Você está em chamas!'
        if (streak >= 14) return 'Duas semanas incrível!'
        if (streak >= 7) return 'Uma semana de dedicação!'
        if (streak >= 3) return 'Boa sequência!'
        if (streak >= 1) return 'Mantenha o ritmo!'
        return 'Comece sua sequência hoje!'
    }

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <Flame
                    size={20}
                    style={{ color: getStreakColor(currentStreak) }}
                    className={currentStreak >= 7 ? 'animate-pulse' : ''}
                />
                <span className="text-white font-bold">{currentStreak}</span>
                <span className="text-slate-400 text-sm">dias</span>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                    <Flame
                        size={24}
                        style={{ color: getStreakColor(currentStreak) }}
                        className={currentStreak >= 7 ? 'animate-pulse' : ''}
                    />
                    Sequência de Atividade
                </h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {/* Current Streak */}
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Flame
                            size={28}
                            style={{ color: getStreakColor(currentStreak) }}
                        />
                        <span
                            className="text-4xl font-bold"
                            style={{ color: getStreakColor(currentStreak) }}
                        >
                            {currentStreak}
                        </span>
                    </div>
                    <div className="text-slate-400 text-sm">Dias seguidos</div>
                    <div className="text-slate-500 text-xs mt-1">
                        {getStreakMessage(currentStreak)}
                    </div>
                </div>

                {/* Longest Streak */}
                <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-2">
                        <Trophy size={28} className="text-yellow-400" />
                        <span className="text-4xl font-bold text-yellow-400">
                            {longestStreak}
                        </span>
                    </div>
                    <div className="text-slate-400 text-sm">Recorde pessoal</div>
                    <div className="text-slate-500 text-xs mt-1">
                        Sua maior sequência
                    </div>
                </div>
            </div>

            {/* Streak Calendar Preview */}
            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex items-center gap-2 mb-3">
                    <Calendar size={16} className="text-slate-400" />
                    <span className="text-slate-400 text-sm">Últimos 7 dias</span>
                </div>
                <div className="flex justify-between">
                    {Array.from({ length: 7 }).map((_, index) => {
                        const isActive = index < currentStreak
                        const dayNames = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
                        const today = new Date().getDay()
                        const dayIndex = (today - 6 + index + 7) % 7

                        return (
                            <div key={index} className="text-center">
                                <div className="text-slate-500 text-xs mb-1">
                                    {dayNames[dayIndex]}
                                </div>
                                <div
                                    className={`
                                        w-8 h-8 rounded-full flex items-center justify-center
                                        ${isActive
                                            ? 'bg-gradient-to-br from-orange-500 to-red-500'
                                            : 'bg-slate-700'}
                                    `}
                                >
                                    {isActive && <Flame size={14} className="text-white" />}
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default UserStreak
