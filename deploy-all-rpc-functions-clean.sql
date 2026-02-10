-- ============================================
-- DEPLOY COMPLETO: TODAS AS FUNÇÕES RPC SCRIBIA
-- ============================================
-- Este script REMOVE funções antigas e cria TODAS as funções RPC necessárias com SECURITY DEFINER

-- ============================================
-- VERIFICAÇÃO INICIAL: RLS DEVE ESTAR DESABILITADO
-- ============================================
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos')
        AND rowsecurity = true
    ) THEN
        RAISE EXCEPTION '❌ ERRO: RLS ainda está ativo. Execute fix-rls-step-by-step.sql primeiro!';
    ELSE
        RAISE NOTICE '✅ OK: RLS desabilitado, prosseguindo...';
    END IF;
END $$;

-- ============================================
-- REMOVER FUNÇÕES ANTIGAS (se existirem)
-- ============================================
DROP FUNCTION IF EXISTS public.scribia_create_palestra CASCADE;
DROP FUNCTION IF EXISTS public.scribia_get_palestras CASCADE;
DROP FUNCTION IF EXISTS public.scribia_update_palestra CASCADE;
DROP FUNCTION IF EXISTS public.scribia_delete_palestra CASCADE;

DROP FUNCTION IF EXISTS public.scribia_create_evento CASCADE;
DROP FUNCTION IF EXISTS public.scribia_get_eventos CASCADE;
DROP FUNCTION IF EXISTS public.scribia_update_evento CASCADE;
DROP FUNCTION IF EXISTS public.scribia_delete_evento CASCADE;

DROP FUNCTION IF EXISTS public.scribia_create_livebook CASCADE;
DROP FUNCTION IF EXISTS public.scribia_get_livebooks CASCADE;
DROP FUNCTION IF EXISTS public.scribia_update_livebook CASCADE;
DROP FUNCTION IF EXISTS public.scribia_delete_livebook CASCADE;

-- ============================================
-- FUNÇÕES DE PALESTRAS
-- ============================================

-- Criar Palestra
CREATE FUNCTION public.scribia_create_palestra(
  p_usuario_id UUID,
  p_evento_id UUID,
  p_titulo TEXT,
  p_palestrante TEXT DEFAULT NULL,
  p_tags_tema TEXT[] DEFAULT NULL,
  p_nivel_escolhido TEXT DEFAULT NULL,
  p_formato_escolhido TEXT DEFAULT NULL,
  p_origem_classificacao TEXT DEFAULT 'manual',
  p_confidence NUMERIC DEFAULT NULL,
  p_webhook_destino TEXT DEFAULT NULL,
  p_status TEXT DEFAULT 'aguardando',
  p_audio_urls TEXT[] DEFAULT NULL,
  p_slides_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_palestra_id UUID;
BEGIN
  -- Validar que o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Validar que o evento existe e pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado ou não pertence ao usuário'
    );
  END IF;

  -- Validar título não vazio
  IF p_titulo IS NULL OR trim(p_titulo) = '' THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Título é obrigatório'
    );
  END IF;

  -- Inserir palestra
  INSERT INTO public.scribia_palestras (
    usuario_id,
    evento_id,
    titulo,
    palestrante,
    tags_tema,
    nivel_escolhido,
    formato_escolhido,
    origem_classificacao,
    confidence,
    webhook_destino,
    status,
    audio_urls,
    slides_url
  ) VALUES (
    p_usuario_id,
    p_evento_id,
    p_titulo,
    p_palestrante,
    p_tags_tema,
    p_nivel_escolhido,
    p_formato_escolhido,
    p_origem_classificacao,
    p_confidence,
    p_webhook_destino,
    p_status,
    p_audio_urls,
    p_slides_url
  )
  RETURNING id INTO v_palestra_id;

  RETURN json_build_object(
    'success', true,
    'palestra_id', v_palestra_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Listar Palestras
CREATE FUNCTION public.scribia_get_palestras(
  p_usuario_id UUID,
  p_evento_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'palestras', (
      SELECT COALESCE(json_agg(row_to_json(p)), '[]'::json)
      FROM public.scribia_palestras p
      WHERE p.usuario_id = p_usuario_id 
        AND p.evento_id = p_evento_id
      ORDER BY p.criado_em DESC
    )
  );
END;
$$;

-- Atualizar Palestra
CREATE FUNCTION public.scribia_update_palestra(
  p_palestra_id UUID,
  p_usuario_id UUID,
  p_titulo TEXT DEFAULT NULL,
  p_palestrante TEXT DEFAULT NULL,
  p_tags_tema TEXT[] DEFAULT NULL,
  p_nivel_escolhido TEXT DEFAULT NULL,
  p_formato_escolhido TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_transcricao_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se a palestra pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Palestra não encontrada ou não pertence ao usuário'
    );
  END IF;

  -- Atualizar campos não nulos
  UPDATE public.scribia_palestras
  SET
    titulo = COALESCE(p_titulo, titulo),
    palestrante = COALESCE(p_palestrante, palestrante),
    tags_tema = COALESCE(p_tags_tema, tags_tema),
    nivel_escolhido = COALESCE(p_nivel_escolhido, nivel_escolhido),
    formato_escolhido = COALESCE(p_formato_escolhido, formato_escolhido),
    status = COALESCE(p_status, status),
    transcricao_url = COALESCE(p_transcricao_url, transcricao_url),
    atualizado_em = now()
  WHERE id = p_palestra_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Deletar Palestra
CREATE FUNCTION public.scribia_delete_palestra(
  p_palestra_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se a palestra pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Palestra não encontrada ou não pertence ao usuário'
    );
  END IF;

  DELETE FROM public.scribia_palestras
  WHERE id = p_palestra_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================
-- FUNÇÕES DE EVENTOS
-- ============================================

-- Criar Evento
CREATE FUNCTION public.scribia_create_evento(
  p_usuario_id UUID,
  p_nome TEXT,
  p_descricao TEXT DEFAULT NULL,
  p_data_inicio TIMESTAMP DEFAULT NULL,
  p_data_fim TIMESTAMP DEFAULT NULL,
  p_local TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_evento_id UUID;
BEGIN
  -- Validar que o usuário existe
  IF NOT EXISTS (SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Inserir evento
  INSERT INTO public.scribia_eventos (
    usuario_id,
    nome,
    descricao,
    data_inicio,
    data_fim,
    local
  ) VALUES (
    p_usuario_id,
    p_nome,
    p_descricao,
    p_data_inicio,
    p_data_fim,
    p_local
  )
  RETURNING id INTO v_evento_id;

  RETURN json_build_object(
    'success', true,
    'evento_id', v_evento_id
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Listar Eventos
CREATE FUNCTION public.scribia_get_eventos(
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'eventos', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM public.scribia_eventos e
      WHERE e.usuario_id = p_usuario_id
      ORDER BY e.criado_em DESC
    )
  );
END;
$$;

-- Atualizar Evento
CREATE FUNCTION public.scribia_update_evento(
  p_evento_id UUID,
  p_usuario_id UUID,
  p_nome TEXT DEFAULT NULL,
  p_descricao TEXT DEFAULT NULL,
  p_data_inicio TIMESTAMP DEFAULT NULL,
  p_data_fim TIMESTAMP DEFAULT NULL,
  p_local TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o evento pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado ou não pertence ao usuário'
    );
  END IF;

  -- Atualizar campos não nulos
  UPDATE public.scribia_eventos
  SET
    nome = COALESCE(p_nome, nome),
    descricao = COALESCE(p_descricao, descricao),
    data_inicio = COALESCE(p_data_inicio, data_inicio),
    data_fim = COALESCE(p_data_fim, data_fim),
    local = COALESCE(p_local, local),
    atualizado_em = now()
  WHERE id = p_evento_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Deletar Evento
CREATE FUNCTION public.scribia_delete_evento(
  p_evento_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o evento pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado ou não pertence ao usuário'
    );
  END IF;

  DELETE FROM public.scribia_eventos
  WHERE id = p_evento_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================
-- FUNÇÕES DE LIVEBOOKS
-- ============================================

-- Criar Livebook
CREATE FUNCTION public.scribia_create_livebook(
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

-- Listar Livebooks
CREATE FUNCTION public.scribia_get_livebooks(
  p_usuario_id UUID,
  p_palestra_id UUID DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN json_build_object(
    'success', true,
    'livebooks', (
      SELECT COALESCE(json_agg(row_to_json(l)), '[]'::json)
      FROM public.scribia_livebooks l
      WHERE l.usuario_id = p_usuario_id
        AND (p_palestra_id IS NULL OR l.palestra_id = p_palestra_id)
      ORDER BY l.criado_em DESC
    )
  );
END;
$$;

-- Atualizar Livebook
CREATE FUNCTION public.scribia_update_livebook(
  p_livebook_id UUID,
  p_usuario_id UUID,
  p_status TEXT DEFAULT NULL,
  p_conteudo JSONB DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o livebook pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_livebooks 
    WHERE id = p_livebook_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Livebook não encontrado ou não pertence ao usuário'
    );
  END IF;

  -- Atualizar campos não nulos
  UPDATE public.scribia_livebooks
  SET
    status = COALESCE(p_status, status),
    conteudo = COALESCE(p_conteudo, conteudo),
    atualizado_em = now()
  WHERE id = p_livebook_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- Deletar Livebook
CREATE FUNCTION public.scribia_delete_livebook(
  p_livebook_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar se o livebook pertence ao usuário
  IF NOT EXISTS (
    SELECT 1 FROM public.scribia_livebooks 
    WHERE id = p_livebook_id AND usuario_id = p_usuario_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Livebook não encontrado ou não pertence ao usuário'
    );
  END IF;

  DELETE FROM public.scribia_livebooks
  WHERE id = p_livebook_id;

  RETURN json_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$;

-- ============================================
-- CONCEDER PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION public.scribia_create_palestra TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_get_palestras TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_update_palestra TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_delete_palestra TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.scribia_create_evento TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_get_eventos TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_update_evento TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_delete_evento TO authenticated, anon, service_role;

GRANT EXECUTE ON FUNCTION public.scribia_create_livebook TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_get_livebooks TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_update_livebook TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.scribia_delete_livebook TO authenticated, anon, service_role;

-- ============================================
-- ADICIONAR COMENTÁRIOS
-- ============================================
COMMENT ON FUNCTION public.scribia_create_palestra IS 'Cria uma palestra com validação de usuário e evento. Usa SECURITY DEFINER.';
COMMENT ON FUNCTION public.scribia_get_palestras IS 'Lista palestras do usuário para um evento específico.';
COMMENT ON FUNCTION public.scribia_update_palestra IS 'Atualiza palestra com validação de propriedade.';
COMMENT ON FUNCTION public.scribia_delete_palestra IS 'Remove palestra com validação de propriedade.';

COMMENT ON FUNCTION public.scribia_create_evento IS 'Cria evento com validação de usuário. Usa SECURITY DEFINER.';
COMMENT ON FUNCTION public.scribia_get_eventos IS 'Lista eventos do usuário.';
COMMENT ON FUNCTION public.scribia_update_evento IS 'Atualiza evento com validação de propriedade.';
COMMENT ON FUNCTION public.scribia_delete_evento IS 'Remove evento com validação de propriedade.';

COMMENT ON FUNCTION public.scribia_create_livebook IS 'Cria livebook associado a uma palestra. Usa SECURITY DEFINER.';
COMMENT ON FUNCTION public.scribia_get_livebooks IS 'Lista livebooks do usuário, opcionalmente filtrado por palestra.';
COMMENT ON FUNCTION public.scribia_update_livebook IS 'Atualiza livebook com validação de propriedade.';
COMMENT ON FUNCTION public.scribia_delete_livebook IS 'Remove livebook com validação de propriedade.';

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================
DO $$
DECLARE
  v_funcoes_criadas INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_funcoes_criadas
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public' 
    AND p.proname IN (
      'scribia_create_palestra',
      'scribia_get_palestras',
      'scribia_update_palestra',
      'scribia_delete_palestra',
      'scribia_create_evento',
      'scribia_get_eventos',
      'scribia_update_evento',
      'scribia_delete_evento',
      'scribia_create_livebook',
      'scribia_get_livebooks',
      'scribia_update_livebook',
      'scribia_delete_livebook'
    );

  IF v_funcoes_criadas = 12 THEN
    RAISE NOTICE '✅ SUCESSO: Todas as 12 funções RPC foram criadas!';
  ELSE
    RAISE WARNING '⚠️ ATENÇÃO: Apenas % de 12 funções foram criadas', v_funcoes_criadas;
  END IF;
END $$;

-- Mostrar resultado
SELECT 
    '✅ DEPLOY CONCLUÍDO!' as status,
    'Todas as funções RPC estão prontas para uso' as mensagem,
    'Execute diagnostic-complete.sql para verificar' as proximo_passo;
