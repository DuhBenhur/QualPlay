// ============================================================================
// QUALPLAY - GAMIFICATION SERVICE
// ============================================================================
// Sistema de badges, níveis, streaks e pontuação
// ============================================================================

import { supabase } from '../lib/supabase'

// ============================================================================
// TYPES
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

export interface UserGamification {
    user_id: string
    total_points: number
    current_level: number
    current_streak: number
    longest_streak: number
    badges_earned: string[]
    last_activity_date: string
    is_profile_public: boolean
    created_at: string
    updated_at: string
}

export interface LevelInfo {
    level: number
    title: string
    minPoints: number
    maxPoints: number
    color: string
}

export interface LeaderboardEntry {
    user_id: string
    display_name: string
    total_points: number
    current_level: number
    badges_count: number
    rank: number
}

// ============================================================================
// CONSTANTS
// ============================================================================

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

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getLevelFromPoints(points: number): LevelInfo {
    return LEVELS.find(l => points >= l.minPoints && points <= l.maxPoints) || LEVELS[0]
}

export function getProgressToNextLevel(points: number): number {
    const currentLevel = getLevelFromPoints(points)
    if (currentLevel.level === 5) return 100

    const nextLevel = LEVELS.find(l => l.level === currentLevel.level + 1)
    if (!nextLevel) return 100

    const pointsInLevel = points - currentLevel.minPoints
    const pointsNeeded = nextLevel.minPoints - currentLevel.minPoints
    return Math.min(100, Math.round((pointsInLevel / pointsNeeded) * 100))
}

export function getBadgeById(id: string): Badge | undefined {
    return BADGES.find(b => b.id === id)
}

export function getBadgeTierColor(tier?: string): string {
    switch (tier) {
        case 'bronze': return '#CD7F32'
        case 'silver': return '#C0C0C0'
        case 'gold': return '#FFD700'
        default: return '#3B82F6'
    }
}

// ============================================================================
// DATABASE OPERATIONS
// ============================================================================

export async function getUserGamification(userId: string): Promise<UserGamification | null> {
    if (!supabase || !userId) return null

    try {
        const { data, error } = await supabase
            .from('user_gamification')
            .select('*')
            .eq('user_id', userId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching user gamification:', error)
            return null
        }

        return data as UserGamification
    } catch (error) {
        console.error('Error in getUserGamification:', error)
        return null
    }
}

export async function initializeUserGamification(userId: string): Promise<UserGamification | null> {
    if (!supabase || !userId) return null

    const initialData: Partial<UserGamification> = {
        user_id: userId,
        total_points: 0,
        current_level: 1,
        current_streak: 0,
        longest_streak: 0,
        badges_earned: [],
        last_activity_date: new Date().toISOString().split('T')[0],
        is_profile_public: true,
    }

    try {
        const { data, error } = await supabase
            .from('user_gamification')
            .upsert(initialData)
            .select()
            .single()

        if (error) {
            console.error('Error initializing user gamification:', error)
            return null
        }

        return data as UserGamification
    } catch (error) {
        console.error('Error in initializeUserGamification:', error)
        return null
    }
}

export async function addPoints(
    userId: string,
    points: number,
    reason: string
): Promise<{ newPoints: number; newLevel: number; newBadges: string[] }> {
    if (!supabase || !userId) {
        return { newPoints: 0, newLevel: 1, newBadges: [] }
    }

    try {
        let gamification = await getUserGamification(userId)
        if (!gamification) {
            gamification = await initializeUserGamification(userId)
        }
        if (!gamification) {
            return { newPoints: 0, newLevel: 1, newBadges: [] }
        }

        const newPoints = gamification.total_points + points
        const newLevel = getLevelFromPoints(newPoints).level
        const today = new Date().toISOString().split('T')[0]

        // Calculate streak
        let newStreak = gamification.current_streak
        const lastActivity = gamification.last_activity_date
        if (lastActivity) {
            const lastDate = new Date(lastActivity)
            const todayDate = new Date(today)
            const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))

            if (diffDays === 1) {
                newStreak += 1
            } else if (diffDays > 1) {
                newStreak = 1
            }
        } else {
            newStreak = 1
        }

        const longestStreak = Math.max(gamification.longest_streak, newStreak)

        // Check for new badges
        const newBadges = await checkAndAwardBadges(userId, {
            ...gamification,
            total_points: newPoints,
            current_streak: newStreak,
        })

        // Update database
        const { error } = await supabase
            .from('user_gamification')
            .update({
                total_points: newPoints,
                current_level: newLevel,
                current_streak: newStreak,
                longest_streak: longestStreak,
                last_activity_date: today,
                badges_earned: [...gamification.badges_earned, ...newBadges],
                updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId)

        if (error) {
            console.error('Error updating points:', error)
        }

        // Log activity
        console.log(`[Gamification] ${reason}: +${points} pts for user ${userId}`)

        return { newPoints, newLevel, newBadges }
    } catch (error) {
        console.error('Error in addPoints:', error)
        return { newPoints: 0, newLevel: 1, newBadges: [] }
    }
}

async function checkAndAwardBadges(userId: string, gamification: UserGamification): Promise<string[]> {
    if (!supabase) return []

    const newBadges: string[] = []
    const earnedBadges = gamification.badges_earned || []

    // Get user stats for badge checks
    const { data: ratingsCount } = await supabase
        .from('ratings')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)

    const { data: reviewsCount } = await supabase
        .from('comments')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .is('parent_id', null)

    const ratings = (ratingsCount as any)?.length || 0
    const reviews = (reviewsCount as any)?.length || 0

    // Check rating badges
    if (ratings >= 1 && !earnedBadges.includes('first_rating')) newBadges.push('first_rating')
    if (ratings >= 10 && !earnedBadges.includes('critic_bronze')) newBadges.push('critic_bronze')
    if (ratings >= 50 && !earnedBadges.includes('critic_silver')) newBadges.push('critic_silver')
    if (ratings >= 100 && !earnedBadges.includes('critic_gold')) newBadges.push('critic_gold')

    // Check review badges
    if (reviews >= 1 && !earnedBadges.includes('first_review')) newBadges.push('first_review')
    if (reviews >= 5 && !earnedBadges.includes('reviewer_5')) newBadges.push('reviewer_5')
    if (reviews >= 20 && !earnedBadges.includes('reviewer_20')) newBadges.push('reviewer_20')

    // Check streak badges
    const streak = gamification.current_streak
    if (streak >= 7 && !earnedBadges.includes('streak_7')) newBadges.push('streak_7')
    if (streak >= 30 && !earnedBadges.includes('streak_30')) newBadges.push('streak_30')
    if (streak >= 100 && !earnedBadges.includes('streak_100')) newBadges.push('streak_100')

    // Send email notifications for new badges
    if (newBadges.length > 0) {
        await sendBadgeNotificationEmail(userId, newBadges)
    }

    return newBadges
}

async function sendBadgeNotificationEmail(userId: string, badgeIds: string[]): Promise<void> {
    // This will be handled by Supabase Edge Functions or webhooks
    // For now, we log and prepare the data structure
    const badges = badgeIds.map(id => getBadgeById(id)).filter(Boolean)

    console.log(`[Gamification] Sending badge notification email to user ${userId}:`, badges)

    // TODO: Trigger Supabase Edge Function for email
    // This structure can be used when setting up Supabase email triggers:
    // INSERT INTO badge_notifications (user_id, badge_ids, sent_at) VALUES (...)
}

export async function updateProfileVisibility(userId: string, isPublic: boolean): Promise<boolean> {
    if (!supabase || !userId) return false

    try {
        const { error } = await supabase
            .from('user_gamification')
            .update({ is_profile_public: isPublic })
            .eq('user_id', userId)

        if (error) {
            console.error('Error updating profile visibility:', error)
            return false
        }

        return true
    } catch (error) {
        console.error('Error in updateProfileVisibility:', error)
        return false
    }
}

export async function getLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    if (!supabase) return []

    try {
        const { data, error } = await supabase
            .from('user_gamification')
            .select(`
                user_id,
                total_points,
                current_level,
                badges_earned,
                is_profile_public
            `)
            .eq('is_profile_public', true)
            .order('total_points', { ascending: false })
            .limit(limit)

        if (error) {
            console.error('Error fetching leaderboard:', error)
            return []
        }

        // Get user profiles for display names
        const entries: LeaderboardEntry[] = await Promise.all(
            (data || []).map(async (entry: any, index: number) => {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('display_name, username')
                    .eq('id', entry.user_id)
                    .single()

                return {
                    user_id: entry.user_id,
                    display_name: (profile as any)?.display_name || (profile as any)?.username || 'Anônimo',
                    total_points: entry.total_points,
                    current_level: entry.current_level,
                    badges_count: entry.badges_earned?.length || 0,
                    rank: index + 1,
                }
            })
        )

        return entries
    } catch (error) {
        console.error('Error in getLeaderboard:', error)
        return []
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GamificationService = {
    getUserGamification,
    initializeUserGamification,
    addPoints,
    updateProfileVisibility,
    getLeaderboard,
    getLevelFromPoints,
    getProgressToNextLevel,
    getBadgeById,
    getBadgeTierColor,
    BADGES,
    LEVELS,
    POINTS,
}
