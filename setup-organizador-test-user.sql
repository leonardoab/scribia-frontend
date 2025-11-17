-- ============================================
-- SETUP ORGANIZADOR TEST USER
-- ============================================
-- Execute este script manualmente no Supabase SQL Editor
-- para criar o usuário de teste do organizador

-- 1. Inserir usuário de teste para organizador na tabela scribia_usuarios
INSERT INTO public.scribia_usuarios (
  id,
  nome_completo,
  email,
  cpf,
  whatsapp,
  senha_hash,
  email_verificado,
  criado_em,
  ultimo_login
) VALUES (
  'f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid,
  'Organizador Teste',
  'organizador@scribia.com',
  NULL,
  NULL,
  crypt('organizador123', gen_salt('bf')),
  true,
  NOW(),
  NULL
) ON CONFLICT (email) DO NOTHING;

-- 2. Inserir role de organizador_evento
INSERT INTO public.scribia_user_roles (user_id, role)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'organizador_evento')
ON CONFLICT (user_id, role) DO NOTHING;

-- 3. Criar assinatura gratuita
INSERT INTO public.scribia_assinaturas (usuario_id, plano, status)
VALUES ('f47ac10b-58cc-4372-a567-0e02b2c3d479'::uuid, 'free', 'ativo')
ON CONFLICT (usuario_id) DO NOTHING;

-- 4. Criar função RPC para atribuir role de organizador
CREATE OR REPLACE FUNCTION public.assign_organizador_role(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.scribia_user_roles (user_id, role)
  VALUES (p_user_id, 'organizador_evento')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- 5. Grant execute permission
GRANT EXECUTE ON FUNCTION public.assign_organizador_role TO authenticated, anon;

-- ============================================
-- VERIFICAR CRIAÇÃO
-- ============================================

-- Verificar se o usuário foi criado
SELECT id, nome_completo, email, email_verificado 
FROM public.scribia_usuarios 
WHERE email = 'organizador@scribia.com';

-- Verificar se o role foi atribuído
SELECT ur.user_id, ur.role, u.email 
FROM public.scribia_user_roles ur
JOIN public.scribia_usuarios u ON ur.user_id = u.id
WHERE u.email = 'organizador@scribia.com';

-- Verificar se a assinatura foi criada
SELECT a.usuario_id, a.plano, a.status, u.email
FROM public.scribia_assinaturas a
JOIN public.scribia_usuarios u ON a.usuario_id = u.id
WHERE u.email = 'organizador@scribia.com';
