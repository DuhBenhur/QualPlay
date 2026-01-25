-- ============================================================================
-- SCRIPT DE CORREÇÃO DE PERFIL (V2)
-- Correção: A coluna correta é 'full_name', não 'display_name'
-- ============================================================================

-- 1. Atualizar nomes usando a parte inicial do email
UPDATE profiles
SET 
  full_name = split_part(email, '@', 1),
  updated_at = NOW()
WHERE 
  email IS NOT NULL 
  AND (full_name IS NULL OR full_name = '' OR full_name = 'Anônimo');

-- 2. Verificar o resultado
SELECT id, email, full_name FROM profiles;
