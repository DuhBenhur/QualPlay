-- ============================================================================
-- SCRIPT DE CORREÇÃO DE PERFIL
-- Atualiza nomes "Anônimo" usando a parte inicial do email
-- ============================================================================

UPDATE profiles
SET 
  username = split_part(email, '@', 1),
  display_name = split_part(email, '@', 1),
  updated_at = NOW()
WHERE 
  email IS NOT NULL 
  AND (display_name IS NULL OR display_name = '' OR display_name = 'Anônimo');

SELECT id, email, display_name FROM profiles;
