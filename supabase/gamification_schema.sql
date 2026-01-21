-- ============================================================================
-- QUALPLAY - GAMIFICATION DATABASE SCHEMA
-- ============================================================================
-- Execute this SQL in your Supabase SQL Editor to create the gamification tables
-- ============================================================================

-- User Gamification Table
CREATE TABLE IF NOT EXISTS user_gamification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_points INTEGER DEFAULT 0,
    current_level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    badges_earned JSONB DEFAULT '[]'::jsonb,
    last_activity_date DATE,
    is_profile_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Index for leaderboard queries
CREATE INDEX IF NOT EXISTS idx_user_gamification_points 
ON user_gamification(total_points DESC) 
WHERE is_profile_public = true;

-- Index for user lookup
CREATE INDEX IF NOT EXISTS idx_user_gamification_user_id 
ON user_gamification(user_id);

-- Badge Notifications Table (for email triggers)
CREATE TABLE IF NOT EXISTS badge_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_ids JSONB NOT NULL,
    email_sent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security Policies
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_notifications ENABLE ROW LEVEL SECURITY;

-- Users can view their own gamification data
CREATE POLICY "Users can view own gamification" ON user_gamification
    FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own gamification data
CREATE POLICY "Users can update own gamification" ON user_gamification
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can insert their own gamification data
CREATE POLICY "Users can insert own gamification" ON user_gamification
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Anyone can view public profiles for leaderboard
CREATE POLICY "Anyone can view public profiles" ON user_gamification
    FOR SELECT USING (is_profile_public = true);

-- Badge notifications are private
CREATE POLICY "Users can view own notifications" ON badge_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON badge_notifications
    FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_user_gamification_updated_at ON user_gamification;
CREATE TRIGGER update_user_gamification_updated_at
    BEFORE UPDATE ON user_gamification
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SUPABASE EDGE FUNCTION FOR BADGE EMAIL NOTIFICATIONS
-- ============================================================================
-- Create this as a Supabase Edge Function (supabase/functions/send-badge-email/index.ts)
-- 
-- import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
-- import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
-- 
-- serve(async (req) => {
--   const { user_id, badge_ids } = await req.json()
--   
--   // Get user email from auth
--   const supabase = createClient(
--     Deno.env.get('SUPABASE_URL')!,
--     Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
--   )
--   
--   const { data: user } = await supabase.auth.admin.getUserById(user_id)
--   
--   // Send email using Supabase's built-in email or a service like Resend
--   // ...
--   
--   return new Response(JSON.stringify({ success: true }))
-- })
-- ============================================================================

-- Sample data for testing (uncomment to use)
-- INSERT INTO user_gamification (user_id, total_points, current_level, badges_earned)
-- VALUES 
--   ('your-test-user-id', 150, 3, '["first_rating", "critic_bronze"]'),
--   ('another-test-user-id', 75, 2, '["first_rating"]');
