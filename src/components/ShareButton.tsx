import React from 'react';
import { Share2, Check } from 'lucide-react';

interface ShareButtonProps {
    url?: string;
    title?: string;
    text?: string;
    className?: string;
    variant?: 'primary' | 'secondary';
}

const ShareButton: React.FC<ShareButtonProps> = ({
    url = window.location.href,
    title = 'QualPlay',
    text = 'Junte-se a mim no QualPlay! Descubra e avalie seus filmes favoritos 🎬',
    className = '',
    variant = 'primary'
}) => {
    const [copied, setCopied] = React.useState(false);

    const handleShare = async () => {
        // Tentar usar Web Share API (disponível em mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text,
                    url
                });
                return;
            } catch (error) {
                // Usuário cancelou ou erro - fallback para copiar
                console.log('Share cancelled or failed');
            }
        }

        // Fallback: copiar para clipboard
        try {
            await navigator.clipboard.writeText(`${text}\n${url}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            console.error('Failed to copy:', error);
        }
    };

    const baseClasses = 'flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200';
    const variantClasses = variant === 'primary'
        ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700 shadow-lg shadow-blue-500/25'
        : 'bg-slate-700 text-white hover:bg-slate-600';

    return (
        <button
            onClick={handleShare}
            className={`${baseClasses} ${variantClasses} ${className}`}
        >
            {copied ? (
                <>
                    <Check size={18} />
                    Link Copiado!
                </>
            ) : (
                <>
                    <Share2 size={18} />
                    Compartilhar QualPlay
                </>
            )}
        </button>
    );
};

export default ShareButton;
