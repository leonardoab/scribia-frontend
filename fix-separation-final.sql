-- SOLUÇÃO DEFINITIVA: Separação completa entre FC Mother e ScribIA
-- VERSÃO FINAL: Sem operações na tabela auth.users (evita erro de permissão)

-- 1. REMOVER APENAS FUNÇÕES QUE PODEMOS CONTROLAR
DROP FUNCTION IF EXISTS public.handle_new_scribia_user() CASCADE;

-- 2. DESABILITAR RLS TEMPORARIAMENTE PARA SCRIBIA
ALTER TABLE public.scribia_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_assinaturas DISABLE ROW LEVEL SECURITY;

-- 3. CRIAR FUNÇÃO EXCLUSIVA PARA SCRIBIA (sem conflitos com FC Mother)
CREATE OR REPLACE FUNCTION public.handle_scribia_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_exists BOOLEAN := FALSE;
BEGIN
    -- Log do início
    RAISE LOG 'ScribIA: Processando novo usuário %', NEW.id;
    
    -- Verificar se já existe (evitar duplicatas)
    SELECT EXISTS(SELECT 1 FROM public.scribia_usuarios WHERE id = NEW.id) INTO user_exists;
    
    IF user_exists THEN
        RAISE LOG 'ScribIA: Usuário % já existe, pulando', NEW.id;
        RETURN NEW;
    END IF;
    
    -- Inserir usuário ScribIA
    INSERT INTO public.scribia_usuarios (id, nome_completo, email, cpf, whatsapp, criado_em)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', 'Usuário'),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
        COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
        NOW()
    );
    
    RAISE LOG 'ScribIA: Usuário % inserido com sucesso', NEW.id;
    
    -- Criar assinatura gratuita
    INSERT INTO public.scribia_assinaturas (usuario_id, plano, status, criado_em)
    VALUES (NEW.id, 'free', 'ativo', NOW());
    
    RAISE LOG 'ScribIA: Assinatura criada para usuário %', NEW.id;
    
    RETURN NEW;
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'ScribIA: ERRO ao processar usuário %: %', NEW.id, SQLERRM;
        -- Não falhar o cadastro por causa do trigger
        RETURN NEW;
END;
$$;

-- 4. REABILITAR RLS COM POLÍTICAS CORRETAS
ALTER TABLE public.scribia_usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_assinaturas ENABLE ROW LEVEL SECURITY;

-- 5. REMOVER POLÍTICAS ANTIGAS E CRIAR NOVAS
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.scribia_assinaturas;
DROP POLICY IF EXISTS "Allow profile creation" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Allow subscription creation" ON public.scribia_assinaturas;
DROP POLICY IF EXISTS "scribia_allow_trigger_insert_users" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "scribia_allow_trigger_insert_subscriptions" ON public.scribia_assinaturas;

-- Política permissiva para o trigger
CREATE POLICY "scribia_allow_trigger_insert_users"
    ON public.scribia_usuarios
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "scribia_allow_trigger_insert_subscriptions"
    ON public.scribia_assinaturas
    FOR INSERT
    WITH CHECK (true);

-- Políticas para usuários normais
CREATE POLICY "scribia_users_can_view_own_profile"
    ON public.scribia_usuarios
    FOR SELECT
    USING (auth.uid() = id);

CREATE POLICY "scribia_users_can_update_own_profile"
    ON public.scribia_usuarios
    FOR UPDATE
    USING (auth.uid() = id);

CREATE POLICY "scribia_users_can_view_own_subscription"
    ON public.scribia_assinaturas
    FOR SELECT
    USING (auth.uid() = usuario_id);

-- 6. COMENTÁRIOS PARA DOCUMENTAÇÃO
COMMENT ON FUNCTION public.handle_scribia_signup() IS 'ScribIA: Trigger exclusivo para cadastros ScribIA. Isolado do FC Mother.';

-- 7. LIMPAR DADOS DE TESTE ANTERIORES (opcional)
DELETE FROM public.scribia_usuarios WHERE email LIKE 'teste%@gmail.com';
DELETE FROM public.scribia_assinaturas WHERE usuario_id NOT IN (SELECT id FROM public.scribia_usuarios);

-- 8. INSTRUÇÕES PARA CRIAR O TRIGGER MANUALMENTE
-- IMPORTANTE: Execute este comando no painel do Supabase (Dashboard > Database > Triggers)
-- ou peça para o administrador do projeto executar:
-- 
-- CREATE TRIGGER scribia_user_signup_trigger
--     AFTER INSERT ON auth.users
--     FOR EACH ROW
--     EXECUTE FUNCTION public.handle_scribia_signup();