-- Solução completa com funções RPC para gerenciar eventos
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Desabilitar RLS na tabela de eventos (as validações serão feitas nas funções)
ALTER TABLE public.scribia_eventos DISABLE ROW LEVEL SECURITY;

-- 2. Criar função para listar eventos do usuário (CORRIGIDA)
CREATE OR REPLACE FUNCTION public.scribia_get_eventos(p_usuario_id UUID)
RETURNS JSON AS $$
DECLARE
  v_eventos JSON;
BEGIN
  -- Usar subquery para ordenar antes de agregar
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

-- 3. Criar função para criar evento
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

-- 4. Criar função para atualizar evento
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

-- 5. Criar função para deletar evento
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

-- 6. Verificar funções criadas
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments
FROM pg_proc 
WHERE proname LIKE 'scribia_%evento%'
ORDER BY proname;

SELECT 'Funções RPC para eventos criadas com sucesso! ✅' as status;
