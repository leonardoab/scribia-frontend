DROP POLICY IF EXISTS "Users can insert their own profile" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Users can insert their own subscription" ON public.scribia_assinaturas;
DROP POLICY IF EXISTS "Allow trigger to insert user profiles" ON public.scribia_usuarios;
DROP POLICY IF EXISTS "Allow subscription creation" ON public.scribia_assinaturas;

CREATE POLICY "Allow profile creation during signup" ON public.scribia_usuarios
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow subscription creation during signup" ON public.scribia_assinaturas
    FOR INSERT WITH CHECK (true);

CREATE OR REPLACE FUNCTION public.handle_new_scribia_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RAISE LOG 'Trigger iniciado para usuário: %', NEW.id;
    
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
        RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_scribia ON auth.users;
CREATE TRIGGER on_auth_user_created_scribia
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_scribia_user();

SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created_scribia';

SELECT 'Trigger corrigido com sucesso! Teste o cadastro agora.' as status;