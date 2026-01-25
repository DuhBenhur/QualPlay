-- ============================================================================
-- SCRIPT DE CORREÇÃO DE PERMISSÕES (RLS)
-- Execute este script no SQL Editor do Supabase para corrigir erros de acesso.
-- ============================================================================

-- 1. Garantir permissões básicas no schema public
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- 2. Corrigir Policies para Ratings (garantir que INSERT funcione)
DROP POLICY IF EXISTS "Users can manage own ratings" ON ratings;
CREATE POLICY "Users can manage own ratings" ON ratings 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Corrigir Policies para Likes
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Users can manage own likes" ON likes 
  FOR ALL 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Corrigir Policies para List Items (Meus Filmes)
DROP POLICY IF EXISTS "Users can manage own list items" ON list_items;
CREATE POLICY "Users can manage own list items" ON list_items 
  FOR ALL 
  USING (
    EXISTS (SELECT 1 FROM custom_lists WHERE id = list_items.list_id AND user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM custom_lists WHERE id = list_items.list_id AND user_id = auth.uid())
  );

-- 5. Corrigir Policies para User Activity Log
DROP POLICY IF EXISTS "Users can manage own activity" ON user_activity_log;
CREATE POLICY "Users can manage own activity" ON user_activity_log 
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Verificação de permissão para tabela comments (Reviews)
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);
