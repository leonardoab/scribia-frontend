-- ============================================
-- CORREÇÃO: Função de Criação de Livebooks
-- ============================================
-- Este script cria a função RPC necessária para criação automática de livebooks

-- PASSO 1: Verificar se RLS está desabilitado
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename = 'scribia_livebooks' 
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ ERRO: RLS ainda está ativo em scribia_livebooks. Execute fix-rls-step-by-step.sql primeiro!';
    ELSE
        RAISE NOTICE '✅ OK: RLS desabilitado em scribia_livebooks';
    END IF;
END $$;

-- PASSO 2: Remover função antiga se existir
DROP FUNCTION IF EXISTS public.scribia_create_livebook(UUID, UUID, TEXT, TEXT);

-- PASSO 3: Criar função RPC com SECURITY DEFINER
CREATE OR REPLACE FUNCTION public.scribia_create_livebook(
  p_palestra_id UUID,
  p_usuario_id UUID,
  p_tipo_resumo TEXT,
  p_status TEXT DEFAULT 'processando'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- PASSO 4: Conceder permissões
GRANT EXECUTE ON FUNCTION public.scribia_create_livebook TO authenticated, anon, service_role;

-- PASSO 5: Adicionar comentário
COMMENT ON FUNCTION public.scribia_create_livebook IS 'Cria um livebook associado a uma palestra. Usa SECURITY DEFINER para evitar problemas de RLS.';

-- VERIFICAÇÃO FINAL
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.proname = 'scribia_create_livebook'
    ) THEN
        RAISE NOTICE '✅ SUCESSO: Função scribia_create_livebook criada com sucesso!';
    ELSE
        RAISE EXCEPTION '❌ ERRO: Função não foi criada corretamente';
    END IF;
END $$;

-- Mostrar resultado
SELECT 
    '✅ CORREÇÃO CONCLUÍDA!' as status,
    'Função scribia_create_livebook está pronta para uso' as mensagem;
