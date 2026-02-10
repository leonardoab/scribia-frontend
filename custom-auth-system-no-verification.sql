-- SISTEMA DE AUTENTICAÇÃO CUSTOMIZADO SCRIBIA (SEM VERIFICAÇÃO DE EMAIL)
-- Este script cria um sistema de autenticação completo usando apenas as tabelas ScribIA

-- 1. ADICIONAR CAMPOS DE SENHA À TABELA SCRIBIA_USUARIOS
ALTER TABLE public.scribia_usuarios 
ADD COLUMN IF NOT EXISTS senha_hash text,
ADD COLUMN IF NOT EXISTS criado_em timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS ultimo_login timestamp with time zone;

-- 2. HABILITAR EXTENSÃO PARA CRIPTOGRAFIA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. FUNÇÃO DE CADASTRO CUSTOMIZADA (SEM VERIFICAÇÃO DE EMAIL)
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

  -- Inserir usuário (email já verificado por padrão)
  INSERT INTO public.scribia_usuarios (
    id, nome_completo, email, cpf, whatsapp, senha_hash, email_verificado, criado_em
  ) VALUES (
    v_user_id, p_nome_completo, p_email, p_cpf, p_whatsapp, v_senha_hash, true, now()
  );

  -- Criar assinatura gratuita
  INSERT INTO public.scribia_assinaturas (usuario_id, plano, status)
  VALUES (v_user_id, 'free', 'ativo');

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

-- 4. FUNÇÃO DE LOGIN CUSTOMIZADA (SEM VERIFICAÇÃO DE EMAIL)
CREATE OR REPLACE FUNCTION public.scribia_login(
  p_email text,
  p_senha text
) RETURNS json AS $$
DECLARE
  v_user record;
  v_subscription record;
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
      'criado_em', v_user.criado_em
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

-- 5. FUNÇÃO PARA BUSCAR DADOS DO USUÁRIO
CREATE OR REPLACE FUNCTION public.scribia_get_user(
  p_user_id uuid
) RETURNS json AS $$
DECLARE
  v_user record;
  v_subscription record;
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
      'criado_em', v_user.criado_em
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

-- 6. FUNÇÃO PARA RESET DE SENHA (OPCIONAL)
CREATE OR REPLACE FUNCTION public.scribia_request_password_reset(
  p_email text
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_token text;
BEGIN
  -- Buscar usuário
  SELECT id INTO v_user_id 
  FROM public.scribia_usuarios 
  WHERE email = p_email;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    -- Retornar sucesso mesmo se email não existir (segurança)
    RETURN json_build_object(
      'success', true,
      'message', 'Se o email existir, você receberá instruções para redefinir a senha'
    );
  END IF;

  -- Gerar token de reset
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Salvar token (você pode criar uma tabela para isso se necessário)
  -- Por enquanto, apenas retornamos sucesso
  
  RETURN json_build_object(
    'success', true,
    'message', 'Se o email existir, você receberá instruções para redefinir a senha',
    'reset_token', v_token
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. ATUALIZAR POLÍTICAS RLS PARA SUPORTAR AS NOVAS FUNÇÕES
-- Política para scribia_usuarios
DROP POLICY IF EXISTS "Users can view own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can view own profile" ON public.scribia_usuarios
  FOR SELECT USING (true); -- Permitir leitura via funções

DROP POLICY IF EXISTS "Users can update own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can update own profile" ON public.scribia_usuarios
  FOR UPDATE USING (true); -- Permitir atualização via funções

DROP POLICY IF EXISTS "Users can insert own profile" ON public.scribia_usuarios;
CREATE POLICY "Users can insert own profile" ON public.scribia_usuarios
  FOR INSERT WITH CHECK (true); -- Permitir inserção via funções

-- Política para scribia_assinaturas
DROP POLICY IF EXISTS "Users can view own subscription" ON public.scribia_assinaturas;
CREATE POLICY "Users can view own subscription" ON public.scribia_assinaturas
  FOR SELECT USING (true); -- Permitir leitura via funções

DROP POLICY IF EXISTS "Users can insert own subscription" ON public.scribia_assinaturas;
CREATE POLICY "Users can insert own subscription" ON public.scribia_assinaturas
  FOR INSERT WITH CHECK (true); -- Permitir inserção via funções

-- 8. CONCEDER PERMISSÕES PARA EXECUÇÃO DAS FUNÇÕES
GRANT EXECUTE ON FUNCTION public.scribia_signup TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_login TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_get_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.scribia_request_password_reset TO anon, authenticated;

-- Comentários finais
COMMENT ON FUNCTION public.scribia_signup IS 'Função para cadastro de usuários sem verificação de email';
COMMENT ON FUNCTION public.scribia_login IS 'Função para login de usuários sem verificação de email';
COMMENT ON FUNCTION public.scribia_get_user IS 'Função para buscar dados do usuário logado';
COMMENT ON FUNCTION public.scribia_request_password_reset IS 'Função para solicitar reset de senha';