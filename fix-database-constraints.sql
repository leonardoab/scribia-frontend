-- Script para corrigir as constraints do banco de dados
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Habilitar extensão pgcrypto (necessária para criptografia de senhas)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Limpar registros órfãos primeiro
DELETE FROM public.scribia_user_roles 
WHERE user_id NOT IN (SELECT id FROM public.scribia_usuarios);

-- 3. Remover constraint antiga que está causando problema
ALTER TABLE public.scribia_user_roles 
DROP CONSTRAINT IF EXISTS scribia_user_roles_user_id_fkey;

-- 4. Adicionar constraint correta com CASCADE
ALTER TABLE public.scribia_user_roles 
ADD CONSTRAINT scribia_user_roles_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.scribia_usuarios(id) ON DELETE CASCADE;

-- 5. Verificar se as tabelas estão corretas
SELECT 'scribia_usuarios' as tabela, count(*) as registros FROM public.scribia_usuarios
UNION ALL
SELECT 'scribia_user_roles' as tabela, count(*) as registros FROM public.scribia_user_roles
UNION ALL
SELECT 'scribia_assinaturas' as tabela, count(*) as registros FROM public.scribia_assinaturas;

-- 6. Testar a função de cadastro
SELECT scribia_signup(
  'Teste User Final',
  'teste.final@example.com', 
  '123456',
  '12345678901',
  '11999999999'
) as resultado_teste;