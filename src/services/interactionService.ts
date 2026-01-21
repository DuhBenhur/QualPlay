// ============================================================================
// QUALPLAY - INTERACTION SERVICE
// ============================================================================
// Serviço centralizado para todas as interações do usuário com filmes
// Cada interação gera logs estruturados para análise de ML
// ============================================================================

import { supabase } from '../lib/supabase'
import type {
    Rating,
    RatingInsert,
    Like,
    LikeInsert,
    Comment,
    CommentInsert,
    UserActivityInsert,
    ActivityContext,
    ActivityActionType
} from '../types/supabase'

// ============================================================================
// TIPOS INTERNOS
// ============================================================================

export interface RatingContext extends ActivityContext {
    previous_rating?: number
    rating_source: 'card' | 'details' | 'list'
}

export interface SaveMovieContext extends ActivityContext {
    search_query?: string
    filter_genres?: number[]
    result_position?: number
}

export interface InteractionResult<T> {
    data: T | null
    error: Error | null
}

// ============================================================================
// FUNÇÕES DE ATIVIDADE (LOGGING)
// ============================================================================

/**
 * Registra uma atividade do usuário no banco de dados
 * Cada interação gera uma linha de log estruturada para ML
 */
export async function logActivity(
    userId: string,
    actionType: ActivityActionType,
    movieId: number | null,
    context: ActivityContext
): Promise<InteractionResult<void>> {
    if (!supabase || !userId) {
        return { data: null, error: new Error('Supabase não disponível ou usuário não autenticado') }
    }

    try {
        const activityLog: UserActivityInsert = {
            user_id: userId,
            movie_id: movieId,
            action_type: actionType,
            context: {
                ...context,
                device: getDeviceType(),
                timestamp: new Date().toISOString()
            }
        }

        const { error } = await supabase
            .from('user_activity_log')
            .insert(activityLog)

        if (error) throw error

        console.log(`[Activity] ${actionType} logged for movie ${movieId}`)
        return { data: undefined, error: null }
    } catch (error) {
        console.error('[Activity] Error logging activity:', error)
        return { data: null, error: error as Error }
    }
}

// ============================================================================
// FUNÇÕES DE RATING
// ============================================================================

/**
 * Avalia um filme com 1-5 estrelas
 * Atualiza se já existir, insere se for novo
 */
export async function rateMovie(
    userId: string,
    movieId: number,
    score: 1 | 2 | 3 | 4 | 5,
    context?: RatingContext
): Promise<InteractionResult<Rating>> {
    if (!supabase || !userId) {
        return { data: null, error: new Error('Supabase não disponível ou usuário não autenticado') }
    }

    try {
        // Verificar se já existe rating
        const { data: existingRating } = await supabase
            .from('ratings')
            .select('*')
            .eq('user_id', userId)
            .eq('movie_id', movieId)
            .single()

        let result: Rating

        if (existingRating) {
            // Atualizar rating existente
            const { data, error } = await supabase
                .from('ratings')
                .update({ score })
                .eq('id', existingRating.id)
                .select()
                .single()

            if (error) throw error
            result = data

            // Log com contexto do rating anterior
            await logActivity(userId, 'click', movieId, {
                ...context,
                page: context?.page || 'details',
                source: 'rating_update',
                previous_rating: existingRating.score
            })
        } else {
            // Inserir novo rating
            const ratingInsert: RatingInsert = {
                user_id: userId,
                movie_id: movieId,
                score
            }

            const { data, error } = await supabase
                .from('ratings')
                .insert(ratingInsert)
                .select()
                .single()

            if (error) throw error
            result = data

            // Log de novo rating
            await logActivity(userId, 'click', movieId, {
                ...context,
                page: context?.page || 'details',
                source: 'rating_new'
            })
        }

        console.log(`[Rating] Movie ${movieId} rated ${score} stars`)
        return { data: result, error: null }
    } catch (error) {
        console.error('[Rating] Error rating movie:', error)
        return { data: null, error: error as Error }
    }
}

/**
 * Obtém o rating do usuário para um filme
 */
export async function getUserRating(
    userId: string,
    movieId: number
): Promise<InteractionResult<Rating | null>> {
    if (!supabase || !userId) {
        return { data: null, error: null }
    }

    try {
        const { data, error } = await supabase
            .from('ratings')
            .select('*')
            .eq('user_id', userId)
            .eq('movie_id', movieId)
            .single()

        if (error && error.code !== 'PGRST116') throw error

        return { data: data || null, error: null }
    } catch (error) {
        console.error('[Rating] Error getting rating:', error)
        return { data: null, error: error as Error }
    }
}

/**
 * Remove o rating do usuário para um filme
 */
export async function removeRating(
    userId: string,
    movieId: number
): Promise<InteractionResult<void>> {
    if (!supabase || !userId) {
        return { data: null, error: new Error('Supabase não disponível') }
    }

    try {
        const { error } = await supabase
            .from('ratings')
            .delete()
            .eq('user_id', userId)
            .eq('movie_id', movieId)

        if (error) throw error

        await logActivity(userId, 'click', movieId, {
            page: 'details',
            source: 'rating_remove'
        })

        return { data: undefined, error: null }
    } catch (error) {
        return { data: null, error: error as Error }
    }
}

// ============================================================================
// FUNÇÕES DE QUICK REVIEW
// ============================================================================

/**
 * Adiciona um quick review (comentário curto) a um filme
 */
export async function addQuickReview(
    userId: string,
    movieId: number,
    content: string,
    context?: ActivityContext
): Promise<InteractionResult<Comment>> {
    if (!supabase || !userId) {
        return { data: null, error: new Error('Supabase não disponível') }
    }

    if (content.length > 280) {
        return { data: null, error: new Error('Review deve ter no máximo 280 caracteres') }
    }

    try {
        const commentInsert: CommentInsert = {
            user_id: userId,
            movie_id: movieId,
            content: content.trim()
        }

        const { data, error } = await supabase
            .from('comments')
            .insert(commentInsert)
            .select()
            .single()

        if (error) throw error

        // Log da atividade
        await logActivity(userId, 'click', movieId, {
            ...context,
            page: context?.page || 'details',
            source: 'quick_review'
        })

        console.log(`[Review] Quick review added for movie ${movieId}`)
        return { data, error: null }
    } catch (error) {
        console.error('[Review] Error adding review:', error)
        return { data: null, error: error as Error }
    }
}

/**
 * Obtém os reviews de um filme
 */
export async function getMovieReviews(
    movieId: number,
    limit: number = 10
): Promise<InteractionResult<Comment[]>> {
    if (!supabase) {
        return { data: [], error: null }
    }

    try {
        const { data, error } = await supabase
            .from('comments')
            .select(`
        *,
        user:profiles(id, full_name, avatar_url)
      `)
            .eq('movie_id', movieId)
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .limit(limit)

        if (error) throw error

        return { data: data || [], error: null }
    } catch (error) {
        console.error('[Review] Error getting reviews:', error)
        return { data: [], error: error as Error }
    }
}

// ============================================================================
// FUNÇÕES DE LIKE
// ============================================================================

/**
 * Curte ou descurte um filme
 */
export async function toggleLike(
    userId: string,
    movieId: number,
    context?: ActivityContext
): Promise<InteractionResult<{ liked: boolean }>> {
    if (!supabase || !userId) {
        return { data: null, error: new Error('Supabase não disponível') }
    }

    try {
        // Verificar se já existe like
        const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('movie_id', movieId)
            .single()

        if (existingLike) {
            // Remover like
            const { error } = await supabase
                .from('likes')
                .delete()
                .eq('id', existingLike.id)

            if (error) throw error

            await logActivity(userId, 'click', movieId, {
                ...context,
                source: 'unlike'
            })

            return { data: { liked: false }, error: null }
        } else {
            // Adicionar like
            const likeInsert: LikeInsert = {
                user_id: userId,
                movie_id: movieId
            }

            const { error } = await supabase
                .from('likes')
                .insert(likeInsert)

            if (error) throw error

            await logActivity(userId, 'click', movieId, {
                ...context,
                source: 'like'
            })

            return { data: { liked: true }, error: null }
        }
    } catch (error) {
        console.error('[Like] Error toggling like:', error)
        return { data: null, error: error as Error }
    }
}

/**
 * Verifica se o usuário curtiu um filme
 */
export async function isMovieLiked(
    userId: string,
    movieId: number
): Promise<boolean> {
    if (!supabase || !userId) return false

    try {
        const { data } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', userId)
            .eq('movie_id', movieId)
            .single()

        return !!data
    } catch {
        return false
    }
}

// ============================================================================
// FUNÇÕES DE FEED DA COMUNIDADE
// ============================================================================

export interface CommunityActivity {
    type: 'rating' | 'review' | 'like'
    user: { id: string; full_name: string; avatar_url: string | null }
    movie_id: number
    movie_title?: string
    score?: number
    content?: string
    created_at: string
}

/**
 * Obtém atividades recentes da comunidade (públicas)
 */
export async function getCommunityFeed(
    limit: number = 20
): Promise<InteractionResult<CommunityActivity[]>> {
    if (!supabase) {
        return { data: [], error: null }
    }

    try {
        // Buscar ratings recentes
        const { data: ratings } = await supabase
            .from('ratings')
            .select(`
        id,
        movie_id,
        score,
        created_at,
        user:profiles(id, full_name, avatar_url)
      `)
            .order('created_at', { ascending: false })
            .limit(limit)

        // Buscar reviews recentes
        const { data: reviews } = await supabase
            .from('comments')
            .select(`
        id,
        movie_id,
        content,
        created_at,
        user:profiles(id, full_name, avatar_url)
      `)
            .is('parent_id', null)
            .order('created_at', { ascending: false })
            .limit(limit)

        // Combinar e ordenar por data
        const activities: CommunityActivity[] = [
            ...(ratings || []).map(r => ({
                type: 'rating' as const,
                user: r.user as any,
                movie_id: r.movie_id,
                score: r.score,
                created_at: r.created_at
            })),
            ...(reviews || []).map(r => ({
                type: 'review' as const,
                user: r.user as any,
                movie_id: r.movie_id,
                content: r.content,
                created_at: r.created_at
            }))
        ].sort((a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ).slice(0, limit)

        return { data: activities, error: null }
    } catch (error) {
        console.error('[Community] Error getting feed:', error)
        return { data: [], error: error as Error }
    }
}

// ============================================================================
// UTILITÁRIOS
// ============================================================================

function getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop'

    const width = window.innerWidth
    if (width < 768) return 'mobile'
    if (width < 1024) return 'tablet'
    return 'desktop'
}

/**
 * Log de visualização de filme (para ML)
 */
export async function logMovieView(
    userId: string | null,
    movieId: number,
    context?: ActivityContext
): Promise<void> {
    if (!userId) return

    await logActivity(userId, 'view', movieId, {
        ...context,
        page: context?.page || 'details'
    })
}

/**
 * Log de busca (para ML)
 */
export async function logSearch(
    userId: string | null,
    query: string,
    resultsCount: number
): Promise<void> {
    if (!userId) return

    await logActivity(userId, 'search', null, {
        page: 'search',
        search_query: query,
        source: `results_${resultsCount}`
    })
}
