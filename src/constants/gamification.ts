// ============================================================================
// QUALPLAY - GAMIFICATION CONSTANTS
// ============================================================================

export interface Badge {
    id: string
    name: string
    description: string
    icon: string
    category: 'rating' | 'review' | 'watching' | 'streak' | 'special'
    requirement: number
    tier?: 'bronze' | 'silver' | 'gold'
}

export interface LevelInfo {
    level: number
    title: string
    minPoints: number
    maxPoints: number
    color: string
}

export const BADGES: Badge[] = [
    // Rating Badges
    { id: 'first_rating', name: 'Estreante', description: 'Avaliou seu primeiro filme', icon: '🎬', category: 'rating', requirement: 1 },
    { id: 'critic_bronze', name: 'Crítico Bronze', description: 'Avaliou 10 filmes', icon: '⭐', category: 'rating', requirement: 10, tier: 'bronze' },
    { id: 'critic_silver', name: 'Crítico Prata', description: 'Avaliou 50 filmes', icon: '⭐', category: 'rating', requirement: 50, tier: 'silver' },
    { id: 'critic_gold', name: 'Crítico Ouro', description: 'Avaliou 100 filmes', icon: '⭐', category: 'rating', requirement: 100, tier: 'gold' },

    // Review Badges
    { id: 'first_review', name: 'Opinião Formada', description: 'Escreveu seu primeiro review', icon: '📝', category: 'review', requirement: 1 },
    { id: 'reviewer_5', name: 'Comentarista', description: 'Escreveu 5 reviews', icon: '💬', category: 'review', requirement: 5 },
    { id: 'reviewer_20', name: 'Articulador', description: 'Escreveu 20 reviews', icon: '✍️', category: 'review', requirement: 20 },

    // Watching Badges
    { id: 'watched_10', name: 'Cinéfilo', description: 'Assistiu 10 filmes', icon: '🎥', category: 'watching', requirement: 10 },
    { id: 'watched_50', name: 'Maratonista', description: 'Assistiu 50 filmes', icon: '🔥', category: 'watching', requirement: 50 },
    { id: 'watched_100', name: 'Lenda do Cinema', description: 'Assistiu 100 filmes', icon: '🏆', category: 'watching', requirement: 100 },

    // Streak Badges
    { id: 'streak_7', name: 'Consistente', description: '7 dias seguidos ativo', icon: '📅', category: 'streak', requirement: 7 },
    { id: 'streak_30', name: 'Dedicado', description: '30 dias seguidos ativo', icon: '🗓️', category: 'streak', requirement: 30 },
    { id: 'streak_100', name: 'Imparável', description: '100 dias seguidos ativo', icon: '💪', category: 'streak', requirement: 100 },

    // Special Badges
    { id: 'genre_expert', name: 'Especialista', description: '20 filmes do mesmo gênero', icon: '🎯', category: 'special', requirement: 20 },
    { id: 'early_adopter', name: 'Pioneiro', description: 'Um dos primeiros usuários', icon: '🚀', category: 'special', requirement: 1 },
]

export const LEVELS: LevelInfo[] = [
    { level: 1, title: 'Espectador', minPoints: 0, maxPoints: 50, color: '#6B7280' },
    { level: 2, title: 'Cinéfilo Iniciante', minPoints: 51, maxPoints: 150, color: '#10B981' },
    { level: 3, title: 'Crítico Amador', minPoints: 151, maxPoints: 400, color: '#3B82F6' },
    { level: 4, title: 'Crítico Profissional', minPoints: 401, maxPoints: 1000, color: '#8B5CF6' },
    { level: 5, title: 'Mestre do Cinema', minPoints: 1001, maxPoints: Infinity, color: '#F59E0B' },
]

export const POINTS = {
    RATE_MOVIE: 5,
    WRITE_REVIEW: 10,
    CREATE_LIST: 15,
    STREAK_BONUS: 2,
    BADGE_EARNED: 25,
}

export function getBadgeTierColor(tier?: string): string {
    switch (tier) {
        case 'bronze': return '#CD7F32'
        case 'silver': return '#C0C0C0'
        case 'gold': return '#FFD700'
        default: return '#3B82F6'
    }
}
