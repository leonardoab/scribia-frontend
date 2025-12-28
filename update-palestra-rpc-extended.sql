-- Atualizar RPC para aceitar nível, formato e webhook
-- Remove a função existente e recria com novos parâmetros

DROP FUNCTION IF EXISTS scribia.scribia_update_palestra(UUID, UUID, TEXT, TEXT, TEXT[]);

CREATE OR REPLACE FUNCTION scribia.scribia_update_palestra(
  p_palestra_id UUID,
  p_usuario_id UUID,
  p_titulo TEXT,
  p_palestrante TEXT DEFAULT NULL,
  p_tags_tema TEXT[] DEFAULT NULL,
  p_nivel_escolhido TEXT DEFAULT NULL,
  p_formato_escolhido TEXT DEFAULT NULL,
  p_webhook_destino TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = scribia, public
AS $$
DECLARE
  v_palestra_exists BOOLEAN;
  v_current_status TEXT;
  v_livebook_status TEXT;
BEGIN
  -- Verificar se usuário existe
  IF NOT EXISTS (SELECT 1 FROM scribia.scribia_usuarios WHERE id = p_usuario_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Verificar se palestra existe e pertence ao usuário
  SELECT EXISTS(
    SELECT 1 FROM scribia.scribia_palestras 
    WHERE id = p_palestra_id AND usuario_id = p_usuario_id
  ), status INTO v_palestra_exists, v_current_status
  FROM scribia.scribia_palestras
  WHERE id = p_palestra_id AND usuario_id = p_usuario_id;

  IF NOT v_palestra_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Palestra não encontrada ou não pertence ao usuário');
  END IF;

  -- Verificar status do livebook associado (se houver)
  SELECT l.status INTO v_livebook_status
  FROM scribia.scribia_livebooks l
  WHERE l.palestra_id = p_palestra_id
  ORDER BY l.criado_em DESC
  LIMIT 1;

  -- Regras de edição baseadas em status
  -- Se está processando, não permite nenhuma edição
  IF v_current_status = 'processando' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Palestra em processamento. Aguarde a conclusão.');
  END IF;

  -- Se livebook concluído, permite apenas edição de dados básicos (título, palestrante, tags)
  -- Não permite alterar nível, formato ou webhook
  IF v_livebook_status = 'concluido' AND (p_nivel_escolhido IS NOT NULL OR p_formato_escolhido IS NOT NULL) THEN
    -- Verifica se está tentando mudar nível/formato
    IF EXISTS (
      SELECT 1 FROM scribia.scribia_palestras 
      WHERE id = p_palestra_id 
      AND (
        (p_nivel_escolhido IS NOT NULL AND nivel_escolhido != p_nivel_escolhido)
        OR (p_formato_escolhido IS NOT NULL AND formato_escolhido != p_formato_escolhido)
      )
    ) THEN
      -- Ainda permite a atualização, mas mantém os valores originais
      UPDATE scribia.scribia_palestras
      SET
        titulo = COALESCE(p_titulo, titulo),
        palestrante = COALESCE(p_palestrante, palestrante),
        tags_tema = COALESCE(p_tags_tema, tags_tema),
        atualizado_em = NOW()
      WHERE id = p_palestra_id AND usuario_id = p_usuario_id;
      
      RETURN jsonb_build_object('success', true, 'message', 'Dados básicos atualizados. Nível e formato mantidos pois o livebook já foi concluído.');
    END IF;
  END IF;

  -- Atualização completa (para status aguardando ou erro)
  UPDATE scribia.scribia_palestras
  SET
    titulo = COALESCE(p_titulo, titulo),
    palestrante = COALESCE(p_palestrante, palestrante),
    tags_tema = COALESCE(p_tags_tema, tags_tema),
    nivel_escolhido = COALESCE(p_nivel_escolhido, nivel_escolhido),
    formato_escolhido = COALESCE(p_formato_escolhido, formato_escolhido),
    webhook_destino = COALESCE(p_webhook_destino, webhook_destino),
    atualizado_em = NOW()
  WHERE id = p_palestra_id AND usuario_id = p_usuario_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION scribia.scribia_update_palestra(UUID, UUID, TEXT, TEXT, TEXT[], TEXT, TEXT, TEXT) TO authenticated, anon, service_role;

-- Função para marcar livebook como finalizado pelo usuário
CREATE OR REPLACE FUNCTION scribia.scribia_finalizar_livebook(
  p_livebook_id UUID,
  p_usuario_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = scribia, public
AS $$
DECLARE
  v_livebook_exists BOOLEAN;
  v_current_status TEXT;
BEGIN
  -- Verificar se usuário existe
  IF NOT EXISTS (SELECT 1 FROM scribia.scribia_usuarios WHERE id = p_usuario_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Usuário não encontrado');
  END IF;

  -- Verificar se livebook existe e pertence ao usuário (via palestra)
  SELECT l.status INTO v_current_status
  FROM scribia.scribia_livebooks l
  JOIN scribia.scribia_palestras p ON l.palestra_id = p.id
  WHERE l.id = p_livebook_id AND p.usuario_id = p_usuario_id;

  IF v_current_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Livebook não encontrado ou não pertence ao usuário');
  END IF;

  -- Verificar se já está concluído
  IF v_current_status = 'concluido' THEN
    RETURN jsonb_build_object('success', true, 'message', 'Livebook já está concluído');
  END IF;

  -- Atualizar status para concluído
  UPDATE scribia.scribia_livebooks
  SET 
    status = 'concluido',
    atualizado_em = NOW()
  WHERE id = p_livebook_id;

  RETURN jsonb_build_object('success', true, 'message', 'Livebook marcado como concluído');
END;
$$;

-- Dar permissões
GRANT EXECUTE ON FUNCTION scribia.scribia_finalizar_livebook(UUID, UUID) TO authenticated, anon, service_role;
