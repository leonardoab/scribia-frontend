-- Criar função RPC com SECURITY DEFINER para inserir livebooks
-- Esta função resolve o problema de RLS ao usar SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.scribia_create_livebook(
  p_palestra_id UUID,
  p_usuario_id UUID,
  p_tipo_resumo TEXT,
  p_status TEXT DEFAULT 'processando'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_livebook_id UUID;
BEGIN
  -- Validar que a palestra existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Palestra não encontrada ou não pertence ao usuário'
    );
  END IF;

  -- Inserir livebook
  INSERT INTO public.scribia_livebooks (
    palestra_id,
    usuario_id,
    tipo_resumo,
    status
  ) VALUES (
    p_palestra_id,
    p_usuario_id,
    p_tipo_resumo,
    p_status
  )
  RETURNING id INTO v_livebook_id;

  RETURN json_build_object(
    'success', true,
    'livebook_id', v_livebook_id
  );
END;
$$;

-- Conceder permissões para que edge functions possam chamar
GRANT EXECUTE ON FUNCTION public.scribia_create_livebook TO authenticated, anon, service_role;

-- Comentário da função
COMMENT ON FUNCTION public.scribia_create_livebook IS 'Cria um livebook associado a uma palestra. Usa SECURITY DEFINER para evitar problemas de RLS.';
