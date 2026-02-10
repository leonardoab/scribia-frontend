-- SISTEMA DE AUTENTICAÇÃO CUSTOMIZADO SCRIBIA COMPLETO
-- Este script cria um sistema de autenticação completo incluindo roles e assinaturas

-- 1. ADICIONAR CAMPOS DE SENHA À TABELA SCRIBIA_USUARIOS
ALTER TABLE public.scribia_usuarios 
ADD COLUMN IF NOT EXISTS senha_hash text,
ADD COLUMN IF NOT EXISTS criado_em timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS ultimo_login timestamp with time zone,
ADD COLUMN IF NOT EXISTS email_verificado boolean DEFAULT true;

-- 2. HABILITAR EXTENSÃO PARA CRIPTOGRAFIA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. CRIAR TABELA DE ROLES SE NÃO EXISTIR
CREATE TABLE IF NOT EXISTS public.scribia_user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.scribia_usuarios(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Habilitar RLS na tabela de roles
ALTER TABLE public.scribia_user_roles ENABLE ROW LEVEL SECURITY;

-- 4. FUNÇÃO DE CADASTRO CUSTOMIZADA COMPLETA
CREATE OR REPLACE FUNCTION public.scribia_signup(
  p_nome_completo text,
  p_email text,
  p_senha text,
  p_cpf text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_senha_hash text;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.scribia_usuarios WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Este email já está cadastrado'
    );
  END IF;

  -- Gerar hash da senha
  v_senha_hash := crypt(p_senha, gen_salt('bf'));
  
  -- Gerar UUID para o usuário
  v_user_id := gen_random_uuid();

  -- Inserir usuário
  INSERT INTO public.scribia_usuarios (
    id, nome_completo, email, cpf, whatsapp, senha_hash, email_verificado, criado_em
  ) VALUES (
    v_user_id, p_nome_completo, p_email, p_cpf, p_whatsapp, v_senha_hash, true, now()
  );

  -- Criar assinatura gratuita
  INSERT INTO public.scribia_assinaturas (usuario_id, plano, status)
  VALUES (v_user_id, 'free', 'ativo');

  -- Criar role de usuário padrão
  INSERT INTO public.scribia_user_roles (user_id, role)
  VALUES (v_user_id, 'user');

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'message', 'Usuário criado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. FUNÇÃO DE LOGIN CUSTOMIZADA
CREATE OR REPLACE FUNCTION public.scribia_login(
  p_email text,
  p_senha text
) RETURNS json AS $$
DECLARE
  v_user record;
  v_subscription record;
  v_roles text[];
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user 
  FROM public.scribia_usuarios 
  WHERE email = p_email;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email ou senha incorretos'
    );
  END IF;

  -- Verificar senha
  IF NOT (v_user.senha_hash = crypt(p_senha, v_user.senha_hash)) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email ou senha incorretos'
    );
  END IF;

  -- Buscar assinatura
  SELECT * INTO v_subscription
  FROM public.scribia_assinaturas
  WHERE usuario_id = v_user.id;

  -- Buscar roles do usuário
  SELECT array_agg(role) INTO v_roles
  FROM public.scribia_user_roles
  WHERE user_id = v_user.id;

  -- Atualizar último login
  UPDATE public.scribia_usuarios 
  SET ultimo_login = now() 
  WHERE id = v_user.id;

  -- Retornar dados do usuário
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'nome_completo', v_user.nome_completo,
      'email', v_user.email,
      'cpf', v_user.cpf,
      'whatsapp', v_user.whatsapp,
      'email_verificado', v_user.email_verificado,
      'ultimo_login', v_user.ultimo_login,
      'criado_em', v_user.criado_em,
      'roles', COALESCE(v_roles, ARRAY['user'])
    ),
    'subscription', json_build_object(
      'id', v_subscription.id,
      'plano', v_subscription.plano,
      'status', v_subscription.status,
      'renovacao_em', v_subscription.renovacao_em
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA BUSCAR DADOS DO USUÁRIO
CREATE OR REPLACE FUNCTION public.scribia_get_user(
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_user record;
  v_subscription record;
  v_roles text[];
BEGIN
  -- Buscar usuário
  SELECT * INTO v_user 
  FROM public.scribia_usuarios 
  WHERE id = p_user_id;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Buscar assinatura
  SELECT * INTO v_subscription
  FROM public.scribia_assinaturas
  WHERE usuario_id = v_user.id;

  -- Buscar roles do usuário
  SELECT array_agg(role) INTO v_roles
  FROM public.scribia_user_roles
  WHERE user_id = v_user.id;

  -- Retornar dados
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'nome_completo', v_user.nome_completo,
      'email', v_user.email,
      'cpf', v_user.cpf,
      'whatsapp', v_user.whatsapp,
      'email_verificado', v_user.email_verificado,
      'ultimo_login', v_user.ultimo_login,
      'criado_em', v_user.criado_em,
      'roles', COALESCE(v_roles, ARRAY['user'])
    ),
    'subscription', json_build_object(
      'id', v_subscription.id,
      'plano', v_subscription.plano,
      'status', v_subscription.status,
      'renovacao_em', v_subscription.renovacao_em
    )
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA ATRIBUIR ROLE DE ADMIN
CREATE OR REPLACE FUNCTION public.scribia_assign_admin_role(
  p_user_email text
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar usuário pelo email
  SELECT id INTO v_user_id
  FROM public.scribia_usuarios
  WHERE email = p_user_email;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Inserir role de admin (se não existir)
  INSERT INTO public.scribia_user_roles (user_id, role)
  VALUES (v_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN json_build_object(
    'success', true,
    'message', 'Role de admin atribuída com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA VERIFICAR SE USUÁRIO É ADMIN
CREATE OR REPLACE FUNCTION public.scribia_is_admin(
  p_user_id uuid
) RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.scribia_user_roles 
    WHERE user_id = p_user_id AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. ATUALIZAR POLÍTICAS RLS
-- Política para scribia_usuarios
DROP POLICY IF EXISTS "Users can view own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can view own profile" ON public.scribia_usuarios
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can update own profile" ON public.scribia_usuarios
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can insert own profile" ON public.scribia_usuarios
  FOR INSERT WITH CHECK (true);

-- Política para scribia_assinaturas
DROP POLICY IF EXISTS "Users can view own subscription" ON public.scribia_assinaturas;
CREATE POLICY "Users can view own subscription" ON public.scribia_assinaturas
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.scribia_assinaturas;
CREATE POLICY "Users can insert own subscription" ON public.scribia_assinaturas
  FOR INSERT WITH CHECK (true);

-- Política para scribia_user_roles
DROP POLICY IF EXISTS "Users can view own roles" ON public.scribia_user_roles;
CREATE POLICY "Users can view own roles" ON public.scribia_user_roles
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own roles" ON public.scribia_user_roles;
CREATE POLICY "Users can insert own roles" ON public.scribia_user_roles
  FOR INSERT WITH CHECK (true);

-- 10. CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.scribia_signup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_get_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_assign_admin_role TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_is_admin TO anon, authenticated;

-- Comentários
COMMENT ON FUNCTION public.scribia_signup IS 'Função para cadastro completo de usuários com roles e assinaturas';
COMMENT ON FUNCTION public.scribia_login IS 'Função para login com informações de roles';
COMMENT ON FUNCTION public.scribia_get_user IS 'Função para buscar dados completos do usuário';
COMMENT ON FUNCTION public.scribia_assign_admin_role IS 'Função para atribuir role de admin a um usuário';
COMMENT ON FUNCTION public.scribia_is_admin IS 'Função para verificar se usuário é admin';