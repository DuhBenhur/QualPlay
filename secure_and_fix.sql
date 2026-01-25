-- ============================================================================
-- SCRIPT FINAL: RESTAURAR SEGURANÇA E CORRIGIR ACESSO
-- ============================================================================
-- Este script faz duas coisas:
-- 1. Reabilita a segurança (RLS) que desligamos para teste.
-- 2. Aplica as regras CORRETAS para que todos possam ver a comunidade.
-- ============================================================================

-- 1. Reabilitar RLS (Segurança)
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- 2. Garantir Políticas de Acesso Público (Leitura)

-- Ratings
DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
CREATE POLICY "Anyone can view ratings" ON ratings FOR SELECT TO public USING (true);

-- Comments
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT TO public USING (true);

-- Likes
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT TO public USING (true);

-- Profiles (necessário para ver quem postou)
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles FOR SELECT TO public USING (true);

-- Lists
DROP POLICY IF EXISTS "Anyone can view public lists" ON custom_lists;
CREATE POLICY "Anyone can view public lists" ON custom_lists 
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- Gamification (Leaderboard)
DROP POLICY IF EXISTS "Anyone can view gamification" ON user_gamification;
CREATE POLICY "Anyone can view gamification" ON user_gamification 
  FOR SELECT USING (is_profile_public = true OR auth.uid() = user_id);

-- Confirmação
SELECT 'Sistema seguro e corrigido! Pode testar no Edge.' as status;
