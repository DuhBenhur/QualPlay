// ============================================================================
// QUALPLAY - QUICK REVIEW COMPONENT
// ============================================================================
// Campo de texto compacto para reviews rápidos (max 280 caracteres)
// ============================================================================

import React, { useState } from 'react'
import { Send, Check, Loader2 } from 'lucide-react'

interface QuickReviewProps {
    onSubmit: (content: string) => Promise<void>
    placeholder?: string
    maxLength?: number
    className?: string
}

const QuickReview: React.FC<QuickReviewProps> = ({
    onSubmit,
    placeholder = 'Escreva um review rápido...',
    maxLength = 280,
    className = ''
}) => {
    const [content, setContent] = useState('')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isSuccess, setIsSuccess] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const charactersLeft = maxLength - content.length
    const isOverLimit = charactersLeft < 0

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!content.trim() || isOverLimit || isSubmitting) return

        setIsSubmitting(true)
        setError(null)

        try {
            await onSubmit(content.trim())
            setIsSuccess(true)
            setContent('')

            // Reset success state after 2 seconds
            setTimeout(() => setIsSuccess(false), 2000)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao enviar review')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className={`space-y-2 ${className}`}>
            <div className="relative">
                <textarea
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={placeholder}
                    disabled={isSubmitting || isSuccess}
                    rows={3}
                    className={`
            w-full px-4 py-3 pr-12
            bg-slate-700/50 border rounded-lg
            text-white placeholder-slate-400
            resize-none
            transition-colors duration-200
            focus:outline-none focus:ring-2
            ${isOverLimit
                            ? 'border-red-500 focus:ring-red-500/50'
                            : 'border-slate-600 focus:ring-blue-500/50'
                        }
            ${isSuccess ? 'bg-green-900/30 border-green-500' : ''}
          `}
                />

                <button
                    type="submit"
                    disabled={!content.trim() || isOverLimit || isSubmitting || isSuccess}
                    className={`
            absolute right-3 bottom-3
            p-2 rounded-full
            transition-all duration-200
            ${isSuccess
                            ? 'bg-green-500 text-white'
                            : content.trim() && !isOverLimit
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : 'bg-slate-600 text-slate-400 cursor-not-allowed'
                        }
          `}
                >
                    {isSubmitting ? (
                        <Loader2 size={18} className="animate-spin" />
                    ) : isSuccess ? (
                        <Check size={18} />
                    ) : (
                        <Send size={18} />
                    )}
                </button>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className={`
          transition-colors duration-200
          ${isOverLimit ? 'text-red-400' : charactersLeft < 50 ? 'text-yellow-400' : 'text-slate-500'}
        `}>
                    {charactersLeft} caracteres restantes
                </span>

                {error && (
                    <span className="text-red-400">
                        {error}
                    </span>
                )}

                {isSuccess && (
                    <span className="text-green-400 flex items-center gap-1">
                        <Check size={12} />
                        Review enviado!
                    </span>
                )}
            </div>
        </form>
    )
}

export default QuickReview
