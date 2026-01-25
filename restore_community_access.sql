-- ============================================================================
-- SCRIPT DE CORREÇÃO DE ACESSO À COMUNIDADE
-- Execute este script no SQL Editor do Supabase para corrigir o bug onde
-- usuários logados não veem os dados da comunidade.
-- ============================================================================

-- 1. RATINGS (Avaliações)
-- Permite que TODOS (logados ou não) vejam todas as avaliações
DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
DROP POLICY IF EXISTS "Public view ratings" ON ratings;
CREATE POLICY "Anyone can view ratings" ON ratings 
  FOR SELECT 
  TO public 
  USING (true);

-- 2. COMMENTS (Reviews)
-- Permite que TODOS vejam todos os comentários
DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
DROP POLICY IF EXISTS "Public view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments 
  FOR SELECT 
  TO public 
  USING (true);

-- 3. LIKES (Curtidas)
-- Permite que TODOS vejam as curtidas (para contagem)
DROP POLICY IF EXISTS "Anyone can view likes count" ON likes;
DROP POLICY IF EXISTS "Anyone can view likes" ON likes;
CREATE POLICY "Anyone can view likes" ON likes 
  FOR SELECT 
  TO public 
  USING (true);

-- 4. PROFILES (Perfis)
-- Garantir que perfis sejam visíveis (necessário para mostrar avatar/nome no feed)
DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles 
  FOR SELECT 
  TO public 
  USING (true);

-- 5. LISTS (Listas)
-- Garantir leitura de listas públicas
DROP POLICY IF EXISTS "Anyone can view public lists" ON custom_lists;
CREATE POLICY "Anyone can view public lists" ON custom_lists 
  FOR SELECT 
  USING (is_public = true OR auth.uid() = user_id);

-- Confirmação
SELECT 'Permissões corrigidas com sucesso!' as status;
