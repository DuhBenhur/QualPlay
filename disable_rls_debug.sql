-- ============================================================================
-- SCRIPT DE DEBUG: DESABILITAR RLS (Segurança a Nível de Linha)
-- ============================================================================
-- ATENÇÃO: Este script remove temporariamente as travas de segurança.
-- Use apenas para confirmar se o erro é causado pelas Políticas de Segurança.
-- Se funcionar após rodar isso, saberemos que o problema está nas Policies.
-- ============================================================================

-- Desabilitar RLS nas tabelas principais
ALTER TABLE ratings DISABLE ROW LEVEL SECURITY;
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE custom_lists DISABLE ROW LEVEL SECURITY;
ALTER TABLE list_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification DISABLE ROW LEVEL SECURITY;

-- Confirmação
SELECT 'RLS Desabilitado - Tente carregar a página agora' as status;

-- ============================================================================
-- PRESERVE ESTE COMANDO PARA REABILITAR DEPOIS:
-- ============================================================================
-- ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE custom_lists ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE list_items ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;
