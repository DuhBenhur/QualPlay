import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface QualPlayRating {
    average: number;
    count: number;
}

/**
 * Hook para buscar rating médio de um filme na comunidade QualPlay
 * @param movieId - ID do filme no TMDB
 * @returns Rating médio e contagem de votos, ou null se não houver avaliações
 */
export function useQualPlayRating(movieId: number): QualPlayRating | null {
    const [rating, setRating] = useState<QualPlayRating | null>(null);

    useEffect(() => {
        if (!movieId) return;

        const fetchRating = async () => {
            try {
                const { data, error } = await supabase
                    .from('ratings')
                    .select('score')
                    .eq('movie_id', movieId);

                if (error) {
                    console.error('[useQualPlayRating] Erro ao buscar ratings:', error);
                    return;
                }

                if (data && data.length > 0) {
                    const sum = data.reduce((acc, r) => acc + r.score, 0);
                    const average = sum / data.length;
                    setRating({
                        average,
                        count: data.length
                    });
                } else {
                    setRating(null);
                }
            } catch (error) {
                console.error('[useQualPlayRating] Erro:', error);
                setRating(null);
            }
        };

        fetchRating();
    }, [movieId]);

    return rating;
}
