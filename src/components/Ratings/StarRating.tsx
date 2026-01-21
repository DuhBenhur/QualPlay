// ============================================================================
// QUALPLAY - STAR RATING COMPONENT
// ============================================================================
// Componente reutilizável de avaliação 1-5 estrelas
// ============================================================================

import React, { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
    value: number // 0-5 (0 = não avaliado)
    onChange?: (value: 1 | 2 | 3 | 4 | 5) => void
    size?: 'sm' | 'md' | 'lg'
    readonly?: boolean
    showLabel?: boolean
    className?: string
}

const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32
}

const StarRating: React.FC<StarRatingProps> = ({
    value,
    onChange,
    size = 'md',
    readonly = false,
    showLabel = false,
    className = ''
}) => {
    const [hoverValue, setHoverValue] = useState(0)
    const starSize = sizeMap[size]

    const handleClick = (starValue: 1 | 2 | 3 | 4 | 5) => {
        if (!readonly && onChange) {
            onChange(starValue)
        }
    }

    const handleMouseEnter = (starValue: number) => {
        if (!readonly) {
            setHoverValue(starValue)
        }
    }

    const handleMouseLeave = () => {
        setHoverValue(0)
    }

    const displayValue = hoverValue || value

    const getStarLabel = (val: number): string => {
        const labels: Record<number, string> = {
            1: 'Ruim',
            2: 'Regular',
            3: 'Bom',
            4: 'Muito Bom',
            5: 'Excelente'
        }
        return labels[val] || ''
    }

    return (
        <div className={`flex items-center gap-1 ${className}`}>
            <div
                className="flex items-center gap-0.5"
                onMouseLeave={handleMouseLeave}
            >
                {[1, 2, 3, 4, 5].map((starValue) => {
                    const isFilled = starValue <= displayValue
                    const isHovering = !readonly && hoverValue > 0

                    return (
                        <button
                            key={starValue}
                            type="button"
                            onClick={() => handleClick(starValue as 1 | 2 | 3 | 4 | 5)}
                            onMouseEnter={() => handleMouseEnter(starValue)}
                            disabled={readonly}
                            className={`
                transition-all duration-150 ease-out
                ${readonly ? 'cursor-default' : 'cursor-pointer hover:scale-110'}
                ${isHovering ? 'transform' : ''}
                focus:outline-none focus:ring-2 focus:ring-yellow-400/50 rounded
              `}
                            aria-label={`Avaliar ${starValue} estrelas`}
                        >
                            <Star
                                size={starSize}
                                className={`
                  transition-colors duration-150
                  ${isFilled
                                        ? 'fill-yellow-400 text-yellow-400'
                                        : 'fill-transparent text-slate-500 hover:text-yellow-300'
                                    }
                `}
                            />
                        </button>
                    )
                })}
            </div>

            {showLabel && displayValue > 0 && (
                <span className={`
          ml-2 font-medium transition-opacity duration-150
          ${size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'}
          ${hoverValue > 0 ? 'text-yellow-400' : 'text-slate-400'}
        `}>
                    {getStarLabel(displayValue)}
                </span>
            )}
        </div>
    )
}

export default StarRating
