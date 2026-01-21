-- ============================================================================
-- QUALPLAY SOCIAL PLATFORM - SUPABASE SCHEMA
-- ============================================================================
-- Este script cria o esquema completo para a evolução social do QualPlay
-- Otimizado para modelos de ML/Recomendação
-- Execute no SQL Editor do Supabase: https://supabase.com/dashboard
-- ============================================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- DROP EXISTING TABLES (se necessário recriar)
-- ============================================================================
-- Descomente as linhas abaixo APENAS se precisar recriar o schema do zero
-- DROP TABLE IF EXISTS genre_affinity_scores CASCADE;
-- DROP TABLE IF EXISTS user_activity_log CASCADE;
-- DROP TABLE IF EXISTS comment_likes CASCADE;
-- DROP TABLE IF EXISTS followers CASCADE;
-- DROP TABLE IF EXISTS list_items CASCADE;
-- DROP TABLE IF EXISTS custom_lists CASCADE;
-- DROP TABLE IF EXISTS comments CASCADE;
-- DROP TABLE IF EXISTS ratings CASCADE;
-- DROP TABLE IF EXISTS likes CASCADE;
-- DROP TABLE IF EXISTS profiles CASCADE;

-- ============================================================================
-- 1. PROFILES - Perfis de Usuário Expandidos
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  genre_preferences JSONB DEFAULT '[]'::jsonb,
  preferred_languages TEXT[] DEFAULT ARRAY['pt'],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice GIN para buscas em genre_preferences
CREATE INDEX IF NOT EXISTS idx_profiles_genre_preferences 
  ON profiles USING GIN (genre_preferences);

COMMENT ON TABLE profiles IS 'Perfis de usuário com preferências para recomendações';
COMMENT ON COLUMN profiles.genre_preferences IS 'Array de IDs de gêneros preferidos do TMDB';

-- ============================================================================
-- 2. LIKES - Curtidas em Filmes (Sinal Binário)
-- ============================================================================
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Índices para consultas frequentes
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_movie_id ON likes(movie_id);
CREATE INDEX IF NOT EXISTS idx_likes_created_at ON likes(created_at DESC);

COMMENT ON TABLE likes IS 'Curtidas em filmes - sinal binário para collaborative filtering';

-- ============================================================================
-- 3. RATINGS - Avaliações 1-5 Estrelas
-- ============================================================================
CREATE TABLE IF NOT EXISTS ratings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, movie_id)
);

-- Índices para análises e recomendações
CREATE INDEX IF NOT EXISTS idx_ratings_user_id ON ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_movie_id ON ratings(movie_id);
CREATE INDEX IF NOT EXISTS idx_ratings_score ON ratings(score);

COMMENT ON TABLE ratings IS 'Avaliações 1-5 estrelas - primary training signal para ML';
COMMENT ON COLUMN ratings.score IS 'Avaliação de 1 a 5 estrelas';

-- ============================================================================
-- 4. COMMENTS - Comentários e Respostas
-- ============================================================================
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para threads e listagens
CREATE INDEX IF NOT EXISTS idx_comments_movie_id ON comments(movie_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);

COMMENT ON TABLE comments IS 'Comentários em filmes com suporte a respostas (threads)';

-- ============================================================================
-- 5. COMMENT_LIKES - Curtidas em Comentários
-- ============================================================================
CREATE TABLE IF NOT EXISTS comment_likes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, comment_id)
);

CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON comment_likes(comment_id);

COMMENT ON TABLE comment_likes IS 'Curtidas em comentários para engagement social';

-- ============================================================================
-- 6. CUSTOM_LISTS - Listas Personalizadas
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_lists (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) <= 100),
  description TEXT CHECK (char_length(description) <= 500),
  cover_image_url TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  list_type TEXT DEFAULT 'manual' CHECK (list_type IN ('manual', 'smart', 'watchlist', 'favorites')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_custom_lists_user_id ON custom_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_lists_is_public ON custom_lists(is_public) WHERE is_public = TRUE;

COMMENT ON TABLE custom_lists IS 'Listas personalizadas de filmes';
COMMENT ON COLUMN custom_lists.list_type IS 'manual=curada, smart=gerada, watchlist=para assistir, favorites=favoritos';

-- ============================================================================
-- 7. LIST_ITEMS - Itens das Listas
-- ============================================================================
CREATE TABLE IF NOT EXISTS list_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  list_id UUID REFERENCES custom_lists(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER NOT NULL,
  movie_title TEXT NOT NULL,
  movie_poster TEXT,
  movie_metadata JSONB DEFAULT '{}'::jsonb,
  position INTEGER DEFAULT 0,
  notes TEXT CHECK (char_length(notes) <= 500),
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(list_id, movie_id)
);

CREATE INDEX IF NOT EXISTS idx_list_items_list_id ON list_items(list_id);
CREATE INDEX IF NOT EXISTS idx_list_items_movie_id ON list_items(movie_id);

COMMENT ON TABLE list_items IS 'Filmes dentro das listas personalizadas';
COMMENT ON COLUMN list_items.movie_metadata IS 'Cache de dados do filme: gêneros, ano, rating TMDB';

-- ============================================================================
-- 8. FOLLOWERS - Sistema de Seguidores
-- ============================================================================
CREATE TABLE IF NOT EXISTS followers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

CREATE INDEX IF NOT EXISTS idx_followers_follower_id ON followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_followers_following_id ON followers(following_id);

COMMENT ON TABLE followers IS 'Relacionamentos de follow entre usuários';

-- ============================================================================
-- 9. USER_ACTIVITY_LOG - Log de Atividades (Feedback Implícito)
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  movie_id INTEGER,
  action_type TEXT NOT NULL CHECK (action_type IN ('view', 'search', 'hover', 'scroll', 'click', 'share')),
  context JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para análise temporal e por usuário
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_movie_id ON user_activity_log(movie_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_action_type ON user_activity_log(action_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity_log(created_at DESC);

-- Particionamento por tempo (para grandes volumes)
-- CREATE INDEX IF NOT EXISTS idx_user_activity_time ON user_activity_log(created_at);

COMMENT ON TABLE user_activity_log IS 'Log de atividades do usuário para implicit feedback em ML';
COMMENT ON COLUMN user_activity_log.context IS 'Contexto: página, fonte, duração, dispositivo, etc';

-- ============================================================================
-- 10. GENRE_AFFINITY_SCORES - Cache de Afinidade por Gênero
-- ============================================================================
CREATE TABLE IF NOT EXISTS genre_affinity_scores (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  genre_id INTEGER NOT NULL,
  affinity_score DECIMAL(4,3) NOT NULL CHECK (affinity_score >= 0 AND affinity_score <= 1),
  interaction_count INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, genre_id)
);

CREATE INDEX IF NOT EXISTS idx_genre_affinity_user_id ON genre_affinity_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_genre_affinity_score ON genre_affinity_scores(affinity_score DESC);

COMMENT ON TABLE genre_affinity_scores IS 'Cache pré-computado de afinidade do usuário por gênero';
COMMENT ON COLUMN genre_affinity_scores.affinity_score IS 'Score normalizado de 0 a 1';

-- ============================================================================
-- TRIGGERS - Atualização Automática de updated_at
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- Aplicar trigger em todas as tabelas com updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOR t IN SELECT unnest(ARRAY['profiles', 'ratings', 'comments', 'custom_lists']) LOOP
    EXECUTE format('
      DROP TRIGGER IF EXISTS update_%s_updated_at ON %s;
      CREATE TRIGGER update_%s_updated_at 
        BEFORE UPDATE ON %s 
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    ', t, t, t, t);
  END LOOP;
END;
$$;

-- ============================================================================
-- TRIGGER - Criar Perfil Automaticamente no Registro
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recriar trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- TRIGGER - Atualizar likes_count em comments
-- ============================================================================
CREATE OR REPLACE FUNCTION update_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE comments SET likes_count = likes_count + 1 WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE comments SET likes_count = likes_count - 1 WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_comment_likes_count_trigger ON comment_likes;
CREATE TRIGGER update_comment_likes_count_trigger
  AFTER INSERT OR DELETE ON comment_likes
  FOR EACH ROW EXECUTE FUNCTION update_comment_likes_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE genre_affinity_scores ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES - Profiles
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view public profiles" ON profiles;
CREATE POLICY "Users can view public profiles" ON profiles 
  FOR SELECT USING (true); -- Perfis são públicos para social

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================================
-- RLS POLICIES - Likes
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own likes" ON likes;
CREATE POLICY "Users can manage own likes" ON likes 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view likes count" ON likes;
CREATE POLICY "Anyone can view likes count" ON likes 
  FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - Ratings
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own ratings" ON ratings;
CREATE POLICY "Users can manage own ratings" ON ratings 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view ratings" ON ratings;
CREATE POLICY "Anyone can view ratings" ON ratings 
  FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - Comments
-- ============================================================================
DROP POLICY IF EXISTS "Users can create comments" ON comments;
CREATE POLICY "Users can create comments" ON comments 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON comments;
CREATE POLICY "Users can update own comments" ON comments 
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON comments;
CREATE POLICY "Users can delete own comments" ON comments 
  FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view comments" ON comments;
CREATE POLICY "Anyone can view comments" ON comments 
  FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - Comment Likes
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own comment likes" ON comment_likes;
CREATE POLICY "Users can manage own comment likes" ON comment_likes 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Custom Lists
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own lists" ON custom_lists;
CREATE POLICY "Users can manage own lists" ON custom_lists 
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can view public lists" ON custom_lists;
CREATE POLICY "Anyone can view public lists" ON custom_lists 
  FOR SELECT USING (is_public = true OR auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - List Items
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own list items" ON list_items;
CREATE POLICY "Users can manage own list items" ON list_items 
  FOR ALL USING (
    EXISTS (SELECT 1 FROM custom_lists WHERE id = list_id AND user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Anyone can view public list items" ON list_items;
CREATE POLICY "Anyone can view public list items" ON list_items 
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM custom_lists WHERE id = list_id AND (is_public = true OR user_id = auth.uid()))
  );

-- ============================================================================
-- RLS POLICIES - Followers
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own follows" ON followers;
CREATE POLICY "Users can manage own follows" ON followers 
  FOR ALL USING (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Anyone can view followers" ON followers;
CREATE POLICY "Anyone can view followers" ON followers 
  FOR SELECT USING (true);

-- ============================================================================
-- RLS POLICIES - User Activity Log
-- ============================================================================
DROP POLICY IF EXISTS "Users can manage own activity" ON user_activity_log;
CREATE POLICY "Users can manage own activity" ON user_activity_log 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- RLS POLICIES - Genre Affinity Scores
-- ============================================================================
DROP POLICY IF EXISTS "Users can view own affinity" ON genre_affinity_scores;
CREATE POLICY "Users can view own affinity" ON genre_affinity_scores 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System can update affinity" ON genre_affinity_scores;
CREATE POLICY "System can update affinity" ON genre_affinity_scores 
  FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- VIEWS ÚTEIS PARA ANALYTICS
-- ============================================================================

-- View: Estatísticas de filmes
CREATE OR REPLACE VIEW movie_stats AS
SELECT 
  m.movie_id,
  COUNT(DISTINCT l.user_id) as likes_count,
  COUNT(DISTINCT r.user_id) as ratings_count,
  ROUND(AVG(r.score)::numeric, 2) as avg_rating,
  COUNT(DISTINCT c.id) as comments_count
FROM (SELECT DISTINCT movie_id FROM likes 
      UNION SELECT DISTINCT movie_id FROM ratings 
      UNION SELECT DISTINCT movie_id FROM comments) m
LEFT JOIN likes l ON m.movie_id = l.movie_id
LEFT JOIN ratings r ON m.movie_id = r.movie_id
LEFT JOIN comments c ON m.movie_id = c.movie_id
GROUP BY m.movie_id;

-- View: Estatísticas de usuário
CREATE OR REPLACE VIEW user_stats AS
SELECT 
  p.id as user_id,
  p.full_name,
  COUNT(DISTINCT l.movie_id) as total_likes,
  COUNT(DISTINCT r.movie_id) as total_ratings,
  ROUND(AVG(r.score)::numeric, 2) as avg_rating_given,
  COUNT(DISTINCT c.id) as total_comments,
  COUNT(DISTINCT cl.id) as total_lists,
  (SELECT COUNT(*) FROM followers WHERE following_id = p.id) as followers_count,
  (SELECT COUNT(*) FROM followers WHERE follower_id = p.id) as following_count
FROM profiles p
LEFT JOIN likes l ON p.id = l.user_id
LEFT JOIN ratings r ON p.id = r.user_id
LEFT JOIN comments c ON p.id = c.user_id
LEFT JOIN custom_lists cl ON p.id = cl.user_id
GROUP BY p.id, p.full_name;

-- ============================================================================
-- FUNÇÕES AUXILIARES
-- ============================================================================

-- Função: Calcular afinidade por gênero para um usuário
CREATE OR REPLACE FUNCTION calculate_genre_affinity(p_user_id UUID)
RETURNS TABLE(genre_id INTEGER, affinity_score DECIMAL, interaction_count INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH user_interactions AS (
    -- Likes (peso 1)
    SELECT 
      l.movie_id,
      1.0 as weight
    FROM likes l WHERE l.user_id = p_user_id
    
    UNION ALL
    
    -- Ratings (peso baseado no score)
    SELECT 
      r.movie_id,
      (r.score / 5.0) as weight
    FROM ratings r WHERE r.user_id = p_user_id
  ),
  -- Aqui você precisaria cruzar com dados de gênero do TMDB
  -- Por enquanto, retorna dados da tabela genre_affinity_scores existente
  existing_scores AS (
    SELECT 
      gas.genre_id,
      gas.affinity_score,
      gas.interaction_count
    FROM genre_affinity_scores gas
    WHERE gas.user_id = p_user_id
  )
  SELECT 
    es.genre_id::INTEGER,
    es.affinity_score::DECIMAL,
    es.interaction_count::INTEGER
  FROM existing_scores es;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- MIGRAÇÃO DE DADOS (se houver dados na tabela user_movies antiga)
-- ============================================================================
-- Execute esta parte APENAS se tiver dados na tabela user_movies que deseja migrar

-- Migrar likes da tabela user_movies (status = 'watched' ou 'want_to_watch')
-- INSERT INTO likes (user_id, movie_id, created_at)
-- SELECT user_id, movie_id, created_at
-- FROM user_movies
-- WHERE status IN ('watched', 'want_to_watch')
-- ON CONFLICT (user_id, movie_id) DO NOTHING;

-- Migrar ratings (converter de 1-10 para 1-5)
-- INSERT INTO ratings (user_id, movie_id, score, created_at)
-- SELECT 
--   user_id, 
--   movie_id, 
--   GREATEST(1, LEAST(5, ROUND(rating / 2.0)::INTEGER)) as score,
--   created_at
-- FROM user_movies
-- WHERE rating IS NOT NULL
-- ON CONFLICT (user_id, movie_id) DO NOTHING;

-- Migrar reviews como comments
-- INSERT INTO comments (user_id, movie_id, content, created_at)
-- SELECT user_id, movie_id, review, created_at
-- FROM user_movies
-- WHERE review IS NOT NULL AND review != ''
-- ON CONFLICT DO NOTHING;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated;

-- ============================================================================
-- VERIFICAÇÃO FINAL
-- ============================================================================
-- Execute para verificar se todas as tabelas foram criadas:
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Resultado esperado:
-- comment_likes
-- comments
-- custom_lists
-- followers
-- genre_affinity_scores
-- likes
-- list_items
-- profiles
-- ratings
-- user_activity_log
