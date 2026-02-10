-- Script para adicionar preferências de perfil do usuário
-- Execute este script no Supabase Dashboard > SQL Editor

-- Adicionar colunas de perfil em scribia_usuarios
ALTER TABLE scribia_usuarios
ADD COLUMN IF NOT EXISTS nivel_preferido TEXT,
ADD COLUMN IF NOT EXISTS formato_preferido TEXT,
ADD COLUMN IF NOT EXISTS perfil_definido BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS perfil_definido_em TIMESTAMP;

-- Adicionar constraint para níveis válidos
ALTER TABLE scribia_usuarios
ADD CONSTRAINT check_nivel_valido 
CHECK (nivel_preferido IS NULL OR nivel_preferido IN ('junior', 'pleno', 'senior'));

-- Adicionar constraint para formatos válidos
ALTER TABLE scribia_usuarios
ADD CONSTRAINT check_formato_valido 
CHECK (formato_preferido IS NULL OR formato_preferido IN ('completo', 'compacto'));

-- Criar função para atualizar perfil do usuário
CREATE OR REPLACE FUNCTION scribia_update_profile(
  p_user_id UUID,
  p_nivel TEXT,
  p_formato TEXT
) RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  -- Validar nível
  IF p_nivel NOT IN ('junior', 'pleno', 'senior') THEN
    RAISE EXCEPTION 'Nível inválido: %', p_nivel;
  END IF;
  
  -- Validar formato
  IF p_formato NOT IN ('completo', 'compacto') THEN
    RAISE EXCEPTION 'Formato inválido: %', p_formato;
  END IF;
  
  -- Atualizar usuário
  UPDATE scribia_usuarios
  SET 
    nivel_preferido = p_nivel,
    formato_preferido = p_formato,
    perfil_definido = TRUE,
    perfil_definido_em = NOW(),
    updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Verificar se atualizou
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuário não encontrado: %', p_user_id;
  END IF;
  
  -- Retornar sucesso
  SELECT jsonb_build_object(
    'success', true,
    'nivel', p_nivel,
    'formato', p_formato,
    'tipo_resumo', p_nivel || '_' || p_formato
  ) INTO v_result;
  
  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Conceder permissões
GRANT EXECUTE ON FUNCTION public.scribia_update_profile TO authenticated;

-- Comentários
COMMENT ON COLUMN scribia_usuarios.nivel_preferido IS 'Nível de conhecimento do usuário: junior, pleno ou senior';
COMMENT ON COLUMN scribia_usuarios.formato_preferido IS 'Formato preferido de resumo: completo ou compacto';
COMMENT ON COLUMN scribia_usuarios.perfil_definido IS 'Indica se o usuário já definiu seu perfil';
COMMENT ON FUNCTION scribia_update_profile IS 'Atualiza o perfil de preferências do usuário';
