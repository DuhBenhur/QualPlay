// ============================================================================
// QUALPLAY - USER LEVEL COMPONENT
// ============================================================================

import React from 'react'
import { TrendingUp, Star } from 'lucide-react'
import { getLevelFromPoints, getProgressToNextLevel } from '../../services/gamificationService'
import { LEVELS } from '../../constants/gamification'

interface UserLevelProps {
    points: number
    compact?: boolean
}

const UserLevel: React.FC<UserLevelProps> = ({ points, compact = false }) => {
    const level = getLevelFromPoints(points)
    const progress = getProgressToNextLevel(points)
    const nextLevel = LEVELS.find(l => l.level === level.level + 1)

    if (compact) {
        return (
            <div className="flex items-center gap-2">
                <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: level.color }}
                >
                    {level.level}
                </div>
                <div>
                    <div className="text-white text-sm font-medium">{level.title}</div>
                    <div className="text-slate-400 text-xs">{points} pts</div>
                </div>
            </div>
        )
    }

    return (
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-2xl shadow-lg"
                        style={{
                            backgroundColor: level.color,
                            boxShadow: `0 4px 20px ${level.color}40`
                        }}
                    >
                        {level.level}
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{level.title}</h3>
                        <p className="text-slate-400 text-sm flex items-center gap-1">
                            <Star size={14} className="text-yellow-400" />
                            {points.toLocaleString()} pontos
                        </p>
                    </div>
                </div>

                {nextLevel && (
                    <div className="text-right">
                        <div className="text-slate-400 text-xs">Próximo nível</div>
                        <div className="text-white font-medium">{nextLevel.title}</div>
                    </div>
                )}
            </div>

            {/* Progress Bar */}
            <div className="relative">
                <div className="h-3 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                            width: `${progress}%`,
                            background: `linear-gradient(to right, ${level.color}, ${nextLevel?.color || level.color})`
                        }}
                    />
                </div>

                {nextLevel && (
                    <div className="flex justify-between mt-2 text-xs text-slate-400">
                        <span>{level.minPoints} pts</span>
                        <span className="flex items-center gap-1">
                            <TrendingUp size={12} />
                            {progress}%
                        </span>
                        <span>{nextLevel.minPoints} pts</span>
                    </div>
                )}
            </div>

            {level.level === 5 && (
                <div className="mt-4 text-center">
                    <span className="text-yellow-400 text-sm">🏆 Você atingiu o nível máximo!</span>
                </div>
            )}
        </div>
    )
}

export default UserLevel
