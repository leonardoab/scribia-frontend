-- ========================================
-- SISTEMA DE AUTENTICAÇÃO CUSTOMIZADO SCRIBIA
-- Remove dependência do auth.users do Supabase
-- ========================================

-- 1. ADICIONAR CAMPO DE SENHA NA TABELA scribia_usuarios
ALTER TABLE public.scribia_usuarios 
ADD COLUMN IF NOT EXISTS senha_hash text,
ADD COLUMN IF NOT EXISTS email_verificado boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS token_verificacao text,
ADD COLUMN IF NOT EXISTS token_reset_senha text,
ADD COLUMN IF NOT EXISTS reset_senha_expira timestamptz,
ADD COLUMN IF NOT EXISTS ultimo_login timestamptz;

-- 2. FUNÇÃO PARA HASH DE SENHA (usando crypt do PostgreSQL)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 3. FUNÇÃO DE CADASTRO CUSTOMIZADA
CREATE OR REPLACE FUNCTION public.scribia_signup(
  p_nome_completo text,
  p_email text,
  p_senha text,
  p_cpf text DEFAULT NULL,
  p_whatsapp text DEFAULT NULL
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_token text;
  v_senha_hash text;
BEGIN
  -- Verificar se email já existe
  IF EXISTS (SELECT 1 FROM public.scribia_usuarios WHERE email = p_email) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email já cadastrado'
    );
  END IF;

  -- Gerar ID e token de verificação
  v_user_id := gen_random_uuid();
  v_token := encode(gen_random_bytes(32), 'hex');
  v_senha_hash := crypt(p_senha, gen_salt('bf'));

  -- Inserir usuário
  INSERT INTO public.scribia_usuarios (
    id, nome_completo, email, cpf, whatsapp, 
    senha_hash, email_verificado, token_verificacao, criado_em
  ) VALUES (
    v_user_id, p_nome_completo, p_email, p_cpf, p_whatsapp,
    v_senha_hash, false, v_token, now()
  );

  -- Criar assinatura gratuita
  INSERT INTO public.scribia_assinaturas (usuario_id, plano, status)
  VALUES (v_user_id, 'free', 'ativo');

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'verification_token', v_token,
    'message', 'Usuário criado com sucesso'
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. FUNÇÃO DE LOGIN CUSTOMIZADA
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

  -- Verificar se email foi verificado (opcional)
  IF NOT v_user.email_verificado THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email não verificado. Verifique sua caixa de entrada.'
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

-- 5. FUNÇÃO PARA VERIFICAR EMAIL
CREATE OR REPLACE FUNCTION public.scribia_verify_email(
  p_token text
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Buscar usuário pelo token
  SELECT id INTO v_user_id
  FROM public.scribia_usuarios
  WHERE token_verificacao = p_token AND NOT email_verificado;

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token inválido ou email já verificado'
    );
  END IF;

  -- Verificar email
  UPDATE public.scribia_usuarios
  SET email_verificado = true, token_verificacao = NULL
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Email verificado com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. FUNÇÃO PARA RESET DE SENHA
CREATE OR REPLACE FUNCTION public.scribia_request_password_reset(
  p_email text
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_token text;
BEGIN
  -- Verificar se usuário existe
  SELECT id INTO v_user_id
  FROM public.scribia_usuarios
  WHERE email = p_email;

  IF NOT FOUND THEN
    -- Por segurança, sempre retorna sucesso
    RETURN json_build_object(
      'success', true,
      'message', 'Se o email existir, você receberá instruções para reset'
    );
  END IF;

  -- Gerar token de reset
  v_token := encode(gen_random_bytes(32), 'hex');

  -- Salvar token (expira em 1 hora)
  UPDATE public.scribia_usuarios
  SET token_reset_senha = v_token,
      reset_senha_expira = now() + interval '1 hour'
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'reset_token', v_token,
    'message', 'Token de reset gerado'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. FUNÇÃO PARA CONFIRMAR RESET DE SENHA
CREATE OR REPLACE FUNCTION public.scribia_reset_password(
  p_token text,
  p_nova_senha text
) RETURNS json AS $$
DECLARE
  v_user_id uuid;
  v_senha_hash text;
BEGIN
  -- Buscar usuário pelo token válido
  SELECT id INTO v_user_id
  FROM public.scribia_usuarios
  WHERE token_reset_senha = p_token 
    AND reset_senha_expira > now();

  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token inválido ou expirado'
    );
  END IF;

  -- Hash da nova senha
  v_senha_hash := crypt(p_nova_senha, gen_salt('bf'));

  -- Atualizar senha e limpar tokens
  UPDATE public.scribia_usuarios
  SET senha_hash = v_senha_hash,
      token_reset_senha = NULL,
      reset_senha_expira = NULL
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Senha alterada com sucesso'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. FUNÇÃO PARA BUSCAR USUÁRIO POR ID (para sessões)
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
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. REMOVER DEPENDÊNCIAS DO AUTH.USERS (OPCIONAL)
-- Desabilitar RLS temporariamente para modificar estrutura
ALTER TABLE public.scribia_usuarios DISABLE ROW LEVEL SECURITY;

-- Remover referência ao auth.users
ALTER TABLE public.scribia_usuarios 
DROP CONSTRAINT IF EXISTS scribia_usuarios_id_fkey;

-- Reabilitar RLS
ALTER TABLE public.scribia_usuarios ENABLE ROW LEVEL SECURITY;

-- 10. ATUALIZAR POLÍTICAS RLS PARA SISTEMA CUSTOMIZADO
DROP POLICY IF EXISTS "Users can view their own profile" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.scribia_usuarios;

-- Novas políticas (mais permissivas para funções customizadas)
CREATE POLICY "Allow custom auth functions" 
  ON public.scribia_usuarios 
  FOR ALL 
  USING (true);

CREATE POLICY "Allow custom auth functions subscriptions" 
  ON public.scribia_assinaturas 
  FOR ALL 
  USING (true);

-- 11. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON FUNCTION public.scribia_signup IS 'Função de cadastro customizada do ScribIA';
COMMENT ON FUNCTION public.scribia_login IS 'Função de login customizada do ScribIA';
COMMENT ON FUNCTION public.scribia_verify_email IS 'Verificação de email customizada';
COMMENT ON FUNCTION public.scribia_request_password_reset IS 'Solicitação de reset de senha';
COMMENT ON FUNCTION public.scribia_reset_password IS 'Confirmação de reset de senha';
COMMENT ON FUNCTION public.scribia_get_user IS 'Busca dados do usuário para sessão';

-- ========================================
-- SISTEMA CUSTOMIZADO CRIADO COM SUCESSO!
-- ========================================