-- ========================================
-- CORREÇÃO FINAL: Remover duplicatas e criar funções corretas
-- Execute este script no Supabase SQL Editor
-- ========================================

-- 1️⃣ REMOVER TODAS AS FUNÇÕES DE EVENTOS (incluindo duplicatas)
DROP FUNCTION IF EXISTS public.scribia_create_evento(uuid, text, text, timestamptz, timestamptz, text) CASCADE;
DROP FUNCTION IF EXISTS public.scribia_create_evento(uuid, text, timestamptz, timestamptz, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.scribia_update_evento(uuid, uuid, text, text, timestamptz, timestamptz, text) CASCADE;
DROP FUNCTION IF EXISTS public.scribia_update_evento(uuid, uuid, text, timestamptz, timestamptz, text, text, text, text) CASCADE;
DROP FUNCTION IF EXISTS public.scribia_delete_evento(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.scribia_get_eventos(uuid) CASCADE;

SELECT '✅ Funções antigas removidas' as status;

-- 2️⃣ DESABILITAR RLS (as validações serão feitas nas funções)
ALTER TABLE public.scribia_eventos DISABLE ROW LEVEL SECURITY;

SELECT '✅ RLS desabilitado' as status;

-- 3️⃣ CRIAR FUNÇÃO PARA LISTAR EVENTOS
CREATE OR REPLACE FUNCTION public.scribia_get_eventos(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  v_eventos JSON;
BEGIN
  SELECT json_agg(row_to_json(e.*))
  INTO v_eventos
  FROM (
    SELECT * 
    FROM public.scribia_eventos
    WHERE usuario_id = p_usuario_id
    ORDER BY criado_em DESC
  ) e;

  RETURN json_build_object('success', true, 'eventos', COALESCE(v_eventos, '[]'::json));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Função scribia_get_eventos criada' as status;

-- 4️⃣ CRIAR FUNÇÃO PARA CRIAR EVENTO
CREATE OR REPLACE FUNCTION public.scribia_create_evento(
  p_usuario_id UUID,
  p_nome_evento TEXT,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ,
  p_cidade TEXT,
  p_estado TEXT,
  p_pais TEXT,
  p_observacoes TEXT
)
RETURNS JSON AS $$
DECLARE
  v_evento_id UUID;
BEGIN
  -- Validar que o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id) THEN
    RETURN json_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Inserir evento
  INSERT INTO public.scribia_eventos (
    usuario_id, nome_evento, data_inicio, data_fim, 
    cidade, estado, pais, observacoes
  ) VALUES (
    p_usuario_id, p_nome_evento, p_data_inicio, p_data_fim,
    p_cidade, p_estado, p_pais, p_observacoes
  )
  RETURNING id INTO v_evento_id;

  RETURN json_build_object('success', true, 'evento_id', v_evento_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Função scribia_create_evento criada' as status;

-- 5️⃣ CRIAR FUNÇÃO PARA ATUALIZAR EVENTO
CREATE OR REPLACE FUNCTION public.scribia_update_evento(
  p_evento_id UUID,
  p_usuario_id UUID,
  p_nome_evento TEXT,
  p_data_inicio TIMESTAMPTZ,
  p_data_fim TIMESTAMPTZ,
  p_cidade TEXT,
  p_estado TEXT,
  p_pais TEXT,
  p_observacoes TEXT
)
RETURNS JSON AS $$
BEGIN
  -- Verificar se o evento pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado ou sem permissão');
  END IF;

  -- Atualizar evento
  UPDATE public.scribia_eventos
  SET 
    nome_evento = p_nome_evento,
    data_inicio = p_data_inicio,
    data_fim = p_data_fim,
    cidade = p_cidade,
    estado = p_estado,
    pais = p_pais,
    observacoes = p_observacoes,
    atualizado_em = NOW()
  WHERE id = p_evento_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Função scribia_update_evento criada' as status;

-- 6️⃣ CRIAR FUNÇÃO PARA DELETAR EVENTO
CREATE OR REPLACE FUNCTION public.scribia_delete_evento(
  p_evento_id UUID,
  p_usuario_id UUID
)
RETURNS JSON AS $$
BEGIN
  -- Verificar se o evento pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Evento não encontrado ou sem permissão');
  END IF;

  -- Deletar evento
  DELETE FROM public.scribia_eventos WHERE id = p_evento_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '✅ Função scribia_delete_evento criada' as status;

-- 7️⃣ CONCEDER PERMISSÕES
GRANT EXECUTE ON FUNCTION public.scribia_get_eventos TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_create_evento TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_update_evento TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_delete_evento TO authenticated, anon, service_role;

SELECT '✅ Permissões concedidas' as status;

-- 8️⃣ VERIFICAÇÃO FINAL
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE 'scribia_%evento%'
ORDER BY proname;

SELECT '🎉 SUCESSO! Funções RPC corrigidas e sem duplicatas!' as status;
