// ============================================================================
// QUALPLAY - BADGE NOTIFICATION COMPONENT
// ============================================================================

import React, { useEffect, useState } from 'react'
import { X, Award, Sparkles } from 'lucide-react'
import { Badge, getBadgeById, getBadgeTierColor } from '../../services/gamificationService'

interface BadgeNotificationProps {
    badgeIds: string[]
    onClose: () => void
}

const BadgeNotification: React.FC<BadgeNotificationProps> = ({ badgeIds, onClose }) => {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isVisible, setIsVisible] = useState(false)

    const badges = badgeIds.map(id => getBadgeById(id)).filter(Boolean) as Badge[]
    const currentBadge = badges[currentIndex]

    useEffect(() => {
        if (badges.length > 0) {
            setTimeout(() => setIsVisible(true), 100)
        }
    }, [badges.length])

    useEffect(() => {
        if (badges.length > 1 && currentIndex < badges.length - 1) {
            const timer = setTimeout(() => {
                setIsVisible(false)
                setTimeout(() => {
                    setCurrentIndex(prev => prev + 1)
                    setIsVisible(true)
                }, 300)
            }, 4000)
            return () => clearTimeout(timer)
        }
    }, [currentIndex, badges.length])

    if (!currentBadge) return null

    const tierColor = getBadgeTierColor(currentBadge.tier)

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div
                className={`
                    relative max-w-md w-full mx-4 p-8 rounded-3xl
                    bg-gradient-to-br from-slate-800 to-slate-900
                    border border-yellow-500/30
                    transform transition-all duration-500
                    ${isVisible ? 'scale-100 opacity-100' : 'scale-90 opacity-0'}
                `}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X size={24} />
                </button>

                {/* Sparkles decoration */}
                <div className="absolute -top-4 -left-4">
                    <Sparkles className="text-yellow-400 animate-pulse" size={32} />
                </div>
                <div className="absolute -bottom-4 -right-4">
                    <Sparkles className="text-yellow-400 animate-pulse" size={24} />
                </div>

                {/* Content */}
                <div className="text-center">
                    <div className="mb-2">
                        <span className="text-yellow-400 text-sm font-medium uppercase tracking-wider">
                            Nova Conquista!
                        </span>
                    </div>

                    {/* Badge icon */}
                    <div
                        className="w-24 h-24 mx-auto mb-6 rounded-2xl flex items-center justify-center text-5xl
                            bg-gradient-to-br from-yellow-500/20 to-orange-500/20
                            border-2 border-yellow-500/50 animate-bounce"
                        style={currentBadge.tier ? { borderColor: tierColor } : {}}
                    >
                        {currentBadge.icon}
                    </div>

                    {/* Badge info */}
                    <h2 className="text-2xl font-bold text-white mb-2">
                        {currentBadge.name}
                    </h2>
                    <p className="text-slate-400 mb-6">
                        {currentBadge.description}
                    </p>

                    {/* Points earned */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-500/20 rounded-full">
                        <Award className="text-yellow-400" size={18} />
                        <span className="text-yellow-400 font-medium">+25 pontos</span>
                    </div>

                    {/* Progress indicator */}
                    {badges.length > 1 && (
                        <div className="flex justify-center gap-2 mt-6">
                            {badges.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-2 h-2 rounded-full transition-colors ${index === currentIndex ? 'bg-yellow-400' : 'bg-slate-600'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>

                {/* Continue button */}
                <button
                    onClick={() => {
                        if (currentIndex < badges.length - 1) {
                            setIsVisible(false)
                            setTimeout(() => {
                                setCurrentIndex(prev => prev + 1)
                                setIsVisible(true)
                            }, 300)
                        } else {
                            onClose()
                        }
                    }}
                    className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 
                        text-white font-medium rounded-xl hover:from-yellow-600 hover:to-orange-600
                        transition-all shadow-lg shadow-yellow-500/25"
                >
                    {currentIndex < badges.length - 1 ? 'Próxima Conquista' : 'Incrível!'}
                </button>
            </div>
        </div>
    )
}

export default BadgeNotification
