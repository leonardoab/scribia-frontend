ALTER TABLE public.scribia_usuarios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_assinaturas DISABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.handle_new_scribia_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
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
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_scribia ON auth.users;
CREATE TRIGGER on_auth_user_created_scribia
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_scribia_user();

SELECT 'Trigger configurado com RLS desabilitado. Teste agora!' as status;