-- Corrigir o trigger handle_new_scribia_user para contornar as políticas RLS
-- O problema é que o trigger não consegue inserir dados devido às políticas RLS

-- Primeiro, vamos criar uma política que permite ao trigger inserir dados
CREATE POLICY "Allow trigger to insert user profiles"
  ON public.scribia_usuarios
  FOR INSERT
  WITH CHECK (true);

-- Também vamos criar uma política para permitir inserção de assinaturas pelo trigger
CREATE POLICY "Allow trigger to insert subscriptions"
  ON public.scribia_assinaturas
  FOR INSERT
  WITH CHECK (true);

-- Recriar a função do trigger com SECURITY DEFINER para contornar RLS
DROP FUNCTION IF EXISTS public.handle_new_scribia_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_scribia_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Inserir na tabela scribia_usuarios
  INSERT INTO public.scribia_usuarios (id, nome_completo, email, cpf, whatsapp)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nome_completo', ''),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'cpf', ''),
    COALESCE(NEW.raw_user_meta_data->>'whatsapp', '')
  );
  
  -- Criar assinatura gratuita por padrão
  INSERT INTO public.scribia_assinaturas (usuario_id, plano, status)
  VALUES (NEW.id, 'free', 'ativo');
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log do erro para debug
    RAISE LOG 'Erro no trigger handle_new_scribia_user: %', SQLERRM;
    RETURN NEW;
END;
$$;

-- Recriar o trigger
DROP TRIGGER IF EXISTS on_auth_user_created_scribia ON auth.users;
CREATE TRIGGER on_auth_user_created_scribia
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_scribia_user();

-- Comentário explicativo
COMMENT ON FUNCTION public.handle_new_scribia_user() IS 'Trigger para criar perfil de usuário automaticamente. SECURITY DEFINER permite contornar RLS.';