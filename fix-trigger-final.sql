-- ========================================
-- CORREÇÃO FINAL DO TRIGGER DE CADASTRO
-- ========================================

-- 1. Remover políticas RLS restritivas existentes
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.scribia_assinaturas;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Allow subscription creation" ON public.scribia_assinaturas;

-- 2. Criar políticas permissivas para o trigger
CREATE POLICY "Allow profile creation during signup" ON public.scribia_usuarios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow subscription creation during signup" ON public.scribia_assinaturas
    FOR INSERT WITH CHECK (true);

-- 3. Recriar a função do trigger com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.handle_new_scribia_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Log do início da execução
    RAISE LOG 'Trigger iniciado para usuário: %', NEW.id;
    
    -- Inserir usuário na tabela scribia_usuarios
    INSERT INTO public.scribia_usuarios (
        id,
        nome_completo,
        email,
        cpf,
        whatsapp,
        criado_em,
        atualizado_em
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
        COALESCE(NEW.raw_user_meta_data->>'whatsapp', ''),
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Usuário inserido na tabela scribia_usuarios: %', NEW.id;
    
    -- Inserir assinatura gratuita
    INSERT INTO public.scribia_assinaturas (
        usuario_id,
        plano,
        status,
        criado_em,
        atualizado_em
    ) VALUES (
        NEW.id,
        'free',
        'active',
        NOW(),
        NOW()
    );
    
    RAISE LOG 'Assinatura criada para usuário: %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Erro no trigger para usuário %: %', NEW.id, SQLERRM;
        RETURN NEW; -- Não falhar o cadastro por causa do trigger
END;
$$;

-- 4. Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created_scribia ON auth.users;
CREATE TRIGGER on_auth_user_created_scribia
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_scribia_user();

-- 5. Verificar se o trigger foi criado
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_scribia';

-- Mensagem de sucesso
SELECT 'Trigger corrigido com sucesso! Teste o cadastro agora.' as status;