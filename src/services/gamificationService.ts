// ============================================================================
// QUALPLAY - GAMIFICATION SERVICE
// ============================================================================
// Sistema de badges, níveis, streaks e pontuação
// ============================================================================

import { supabase } from '../lib/supabase'
import {
    BADGES,
    LEVELS,
    POINTS,
    Badge,
    LevelInfo,
    getBadgeTierColor
} from '../constants/gamification'

// ============================================================================
// TYPES
// ============================================================================

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

export interface LeaderboardEntry {
    user_id: string
    display_name: string
    total_points: number
    current_level: number
    badges_count: number
    rank: number
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

        // Notify UI components
        if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('gamificationUpdated', {
                detail: { newPoints, newLevel, newBadges }
            }))
        }

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
    if (!supabase) {
        return []
    }

    try {
        // Timeout de 2 segundos
        const timeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 2000)
        )

        const fetchLeaderboard = async () => {
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

            if (error) throw error

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
        }

        const entries = await Promise.race([fetchLeaderboard(), timeout])
        return entries
    } catch (error) {
        console.warn('[Leaderboard] Backend unavailable:', error)
        return []
    }
}

// ============================================================================
// SYNC LOGIC (RETROACTIVE)
// ============================================================================

export async function syncUserGamification(userId: string): Promise<UserGamification | null> {
    if (!supabase || !userId) return null

    try {
        console.log('[Gamification] Starting sync for user:', userId)

        let gamification = await getUserGamification(userId)
        if (!gamification) {
            gamification = await initializeUserGamification(userId)
        }
        if (!gamification) return null

        const earnedBadges = new Set(gamification.badges_earned || [])
        const newBadges: string[] = []
        let pointsToAdd = 0

        // 1. Check Ratings
        const { count: ratingsCount } = await supabase
            .from('ratings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)

        const ratings = ratingsCount || 0
        console.log(`[Gamification Sync] Found ${ratings} ratings`)

        if (ratings >= 1 && !earnedBadges.has('first_rating')) { newBadges.push('first_rating'); pointsToAdd += POINTS.BADGE_EARNED }
        if (ratings >= 10 && !earnedBadges.has('critic_bronze')) { newBadges.push('critic_bronze'); pointsToAdd += POINTS.BADGE_EARNED }
        if (ratings >= 50 && !earnedBadges.has('critic_silver')) { newBadges.push('critic_silver'); pointsToAdd += POINTS.BADGE_EARNED }
        if (ratings >= 100 && !earnedBadges.has('critic_gold')) { newBadges.push('critic_gold'); pointsToAdd += POINTS.BADGE_EARNED }

        // 2. Check Reviews
        const { count: reviewsCount } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .is('parent_id', null)

        const reviews = reviewsCount || 0
        console.log(`[Gamification Sync] Found ${reviews} reviews`)

        if (reviews >= 1 && !earnedBadges.has('first_review')) { newBadges.push('first_review'); pointsToAdd += POINTS.BADGE_EARNED }
        if (reviews >= 5 && !earnedBadges.has('reviewer_5')) { newBadges.push('reviewer_5'); pointsToAdd += POINTS.BADGE_EARNED }
        if (reviews >= 20 && !earnedBadges.has('reviewer_20')) { newBadges.push('reviewer_20'); pointsToAdd += POINTS.BADGE_EARNED }

        // 3. Recalculate Points logic (Simplified retroactive fix)
        // If we found new badges, we add points and badges
        if (newBadges.length > 0) {
            console.log('[Gamification Sync] New badges found:', newBadges)

            const updatedBadges = [...gamification.badges_earned, ...newBadges]
            const updatedPoints = gamification.total_points + pointsToAdd
            const updatedLevel = getLevelFromPoints(updatedPoints).level

            const { data, error } = await supabase
                .from('user_gamification')
                .update({
                    badges_earned: updatedBadges,
                    total_points: updatedPoints,
                    current_level: updatedLevel,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', userId)
                .select()
                .single()

            if (error) throw error
            return data as UserGamification
        }

        console.log('[Gamification Sync] No new badges found.')
        return gamification

    } catch (error) {
        console.error('[Gamification] Error in sync:', error)
        return null
    }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const GamificationService = {
    getUserGamification,
    initializeUserGamification,
    addPoints,
    syncUserGamification, // Added here
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
