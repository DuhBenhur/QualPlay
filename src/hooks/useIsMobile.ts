import { useState, useEffect } from 'react';

/**
 * Hook para detectar se está em dispositivo mobile
 * Considera mobile quando largura < 768px (breakpoint md do Tailwind)
 */
export function useIsMobile(): boolean {
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };

        // Checagem inicial
        checkMobile();

        // Listener para mudanças de tamanho
        window.addEventListener('resize', checkMobile);

        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    return isMobile;
}
