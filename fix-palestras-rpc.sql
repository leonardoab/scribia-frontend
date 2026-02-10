-- ============================================
-- DESABILITAR RLS NA TABELA DE PALESTRAS
-- ============================================
ALTER TABLE public.scribia_palestras DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 1. FUNÇÃO: LISTAR PALESTRAS DE UM EVENTO
-- ============================================
CREATE OR REPLACE FUNCTION public.scribia_get_palestras(
  p_usuario_id UUID,
  p_evento_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_exists BOOLEAN;
  v_evento_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar se o evento existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) INTO v_evento_exists;

  IF NOT v_evento_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado ou não pertence ao usuário'
    );
  END IF;

  -- Buscar palestras do evento
  SELECT json_build_object(
    'success', true,
    'palestras', COALESCE(json_agg(
      json_build_object(
        'id', p.id,
        'evento_id', p.evento_id,
        'usuario_id', p.usuario_id,
        'titulo', p.titulo,
        'palestrante', p.palestrante,
        'tags_tema', p.tags_tema,
        'nivel_escolhido', p.nivel_escolhido,
        'formato_escolhido', p.formato_escolhido,
        'origem_classificacao', p.origem_classificacao,
        'confidence', p.confidence,
        'webhook_destino', p.webhook_destino,
        'status', p.status,
        'audio_url', p.audio_url,
        'slides_url', p.slides_url,
        'transcricao_url', p.transcricao_url,
        'criado_em', p.criado_em,
        'atualizado_em', p.atualizado_em
      ) ORDER BY p.criado_em DESC
    ), '[]'::json)
  ) INTO v_result
  FROM public.scribia_palestras p
  WHERE p.evento_id = p_evento_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- 2. FUNÇÃO: CRIAR PALESTRA
-- ============================================
CREATE OR REPLACE FUNCTION public.scribia_create_palestra(
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
AS $$
DECLARE
  v_palestra_id UUID;
  v_result JSON;
  v_user_exists BOOLEAN;
  v_evento_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar se o evento existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_eventos 
    WHERE id = p_evento_id AND usuario_id = p_usuario_id
  ) INTO v_evento_exists;

  IF NOT v_evento_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Evento não encontrado ou não pertence ao usuário'
    );
  END IF;

  -- Validar título
  IF p_titulo IS NULL OR TRIM(p_titulo) = '' THEN
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

  -- Buscar palestra criada
  SELECT json_build_object(
    'success', true,
    'palestra', json_build_object(
      'id', p.id,
      'evento_id', p.evento_id,
      'usuario_id', p.usuario_id,
      'titulo', p.titulo,
      'palestrante', p.palestrante,
      'tags_tema', p.tags_tema,
      'nivel_escolhido', p.nivel_escolhido,
      'formato_escolhido', p.formato_escolhido,
      'origem_classificacao', p.origem_classificacao,
      'confidence', p.confidence,
      'webhook_destino', p.webhook_destino,
      'status', p.status,
      'audio_urls', p.audio_urls,
      'slides_url', p.slides_url,
      'transcricao_url', p.transcricao_url,
      'criado_em', p.criado_em,
      'atualizado_em', p.atualizado_em
    )
  ) INTO v_result
  FROM public.scribia_palestras p
  WHERE p.id = v_palestra_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- 3. FUNÇÃO: ATUALIZAR PALESTRA
-- ============================================
CREATE OR REPLACE FUNCTION public.scribia_update_palestra(
  p_palestra_id UUID,
  p_usuario_id UUID,
  p_titulo TEXT DEFAULT NULL,
  p_palestrante TEXT DEFAULT NULL,
  p_tags_tema TEXT[] DEFAULT NULL,
  p_nivel_escolhido TEXT DEFAULT NULL,
  p_formato_escolhido TEXT DEFAULT NULL,
  p_origem_classificacao TEXT DEFAULT NULL,
  p_confidence NUMERIC DEFAULT NULL,
  p_webhook_destino TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL,
  p_audio_url TEXT DEFAULT NULL,
  p_slides_url TEXT DEFAULT NULL,
  p_transcricao_url TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_user_exists BOOLEAN;
  v_palestra_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar se a palestra existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ) INTO v_palestra_exists;

  IF NOT v_palestra_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Palestra não encontrada ou não pertence ao usuário'
    );
  END IF;

  -- Atualizar palestra (apenas campos não nulos)
  UPDATE public.scribia_palestras
  SET
    titulo = COALESCE(p_titulo, titulo),
    palestrante = COALESCE(p_palestrante, palestrante),
    tags_tema = COALESCE(p_tags_tema, tags_tema),
    nivel_escolhido = COALESCE(p_nivel_escolhido, nivel_escolhido),
    formato_escolhido = COALESCE(p_formato_escolhido, formato_escolhido),
    origem_classificacao = COALESCE(p_origem_classificacao, origem_classificacao),
    confidence = COALESCE(p_confidence, confidence),
    webhook_destino = COALESCE(p_webhook_destino, webhook_destino),
    status = COALESCE(p_status, status),
    audio_url = COALESCE(p_audio_url, audio_url),
    slides_url = COALESCE(p_slides_url, slides_url),
    transcricao_url = COALESCE(p_transcricao_url, transcricao_url),
    atualizado_em = NOW()
  WHERE id = p_palestra_id;

  -- Buscar palestra atualizada
  SELECT json_build_object(
    'success', true,
    'palestra', json_build_object(
      'id', p.id,
      'evento_id', p.evento_id,
      'usuario_id', p.usuario_id,
      'titulo', p.titulo,
      'palestrante', p.palestrante,
      'tags_tema', p.tags_tema,
      'nivel_escolhido', p.nivel_escolhido,
      'formato_escolhido', p.formato_escolhido,
      'origem_classificacao', p.origem_classificacao,
      'confidence', p.confidence,
      'webhook_destino', p.webhook_destino,
      'status', p.status,
      'audio_url', p.audio_url,
      'slides_url', p.slides_url,
      'transcricao_url', p.transcricao_url,
      'criado_em', p.criado_em,
      'atualizado_em', p.atualizado_em
    )
  ) INTO v_result
  FROM public.scribia_palestras p
  WHERE p.id = p_palestra_id;

  RETURN v_result;
END;
$$;

-- ============================================
-- 4. FUNÇÃO: DELETAR PALESTRA
-- ============================================
CREATE OR REPLACE FUNCTION public.scribia_delete_palestra(
  p_palestra_id UUID,
  p_usuario_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_exists BOOLEAN;
  v_palestra_exists BOOLEAN;
BEGIN
  -- Verificar se o usuário existe
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_usuarios WHERE id = p_usuario_id
  ) INTO v_user_exists;

  IF NOT v_user_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Usuário não encontrado'
    );
  END IF;

  -- Verificar se a palestra existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM public.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ) INTO v_palestra_exists;

  IF NOT v_palestra_exists THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Palestra não encontrada ou não pertence ao usuário'
    );
  END IF;

  -- Deletar palestra
  DELETE FROM public.scribia_palestras
  WHERE id = p_palestra_id;

  RETURN json_build_object(
    'success', true,
    'message', 'Palestra deletada com sucesso'
  );
END;
$$;

-- ============================================
-- CONCEDER PERMISSÕES
-- ============================================
GRANT EXECUTE ON FUNCTION public.scribia_get_palestras TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.scribia_create_palestra TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.scribia_update_palestra TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.scribia_delete_palestra TO authenticated, anon;
