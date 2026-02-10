-- ============================================================================
-- MIGRAÇÃO COMPLETA: SUPORTAR MÚLTIPLOS ÁUDIOS
-- ============================================================================
-- Este script adiciona suporte para múltiplos áudios por palestra
-- ============================================================================

-- ETAPA 1: Adicionar coluna audio_urls (array de URLs)
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'scribia_palestras' 
      AND column_name = 'audio_urls'
  ) THEN
    ALTER TABLE public.scribia_palestras 
    ADD COLUMN audio_urls TEXT[];
    
    RAISE NOTICE '✅ Coluna audio_urls adicionada com sucesso';
  ELSE
    RAISE NOTICE '⚠️ Coluna audio_urls já existe, pulando criação';
  END IF;
END $$;

-- ETAPA 2: Migrar dados existentes de audio_url para audio_urls
-- ============================================================================
DO $$
DECLARE
  v_migrated_count INT := 0;
BEGIN
  -- Migrar apenas registros que têm audio_url preenchido mas audio_urls vazio
  UPDATE public.scribia_palestras
  SET audio_urls = ARRAY[audio_url]
  WHERE audio_url IS NOT NULL 
    AND audio_url != ''
    AND (audio_urls IS NULL OR array_length(audio_urls, 1) IS NULL);
  
  GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
  
  IF v_migrated_count > 0 THEN
    RAISE NOTICE '✅ % registro(s) migrado(s) de audio_url para audio_urls', v_migrated_count;
  ELSE
    RAISE NOTICE '⚠️ Nenhum registro para migrar (já estão atualizados ou vazios)';
  END IF;
END $$;

-- ETAPA 3: Adicionar comentário explicativo
-- ============================================================================
COMMENT ON COLUMN public.scribia_palestras.audio_urls IS 
'Array de URLs de áudios que serão transcritos e consolidados em uma única transcrição. Substitui audio_url (singular).';

COMMENT ON COLUMN public.scribia_palestras.audio_url IS 
'[DEPRECATED] Usar audio_urls (array). Mantido por compatibilidade.';

-- ETAPA 4: Diagnóstico Final
-- ============================================================================
DO $$
DECLARE
  v_output TEXT := E'\n';
  v_total_palestras INT;
  v_palestras_com_audio INT;
  v_palestras_com_audio_urls INT;
BEGIN
  v_output := v_output || E'============================================================================\n';
  v_output := v_output || E'DIAGNÓSTICO - MIGRAÇÃO AUDIO_URLS\n';
  v_output := v_output || E'============================================================================\n\n';

  -- Contar registros
  SELECT COUNT(*) INTO v_total_palestras FROM public.scribia_palestras;
  SELECT COUNT(*) INTO v_palestras_com_audio 
  FROM public.scribia_palestras 
  WHERE audio_url IS NOT NULL AND audio_url != '';
  
  SELECT COUNT(*) INTO v_palestras_com_audio_urls 
  FROM public.scribia_palestras 
  WHERE audio_urls IS NOT NULL AND array_length(audio_urls, 1) > 0;

  v_output := v_output || E'1. ESTATÍSTICAS:\n';
  v_output := v_output || E'----------------\n';
  v_output := v_output || format('Total de palestras: %s', v_total_palestras) || E'\n';
  v_output := v_output || format('Palestras com audio_url (singular): %s', v_palestras_com_audio) || E'\n';
  v_output := v_output || format('Palestras com audio_urls (plural): %s', v_palestras_com_audio_urls) || E'\n';

  v_output := v_output || E'\n2. ESTRUTURA DA TABELA:\n';
  v_output := v_output || E'-----------------------\n';
  v_output := v_output || E'✅ Coluna audio_url (TEXT) - [DEPRECATED]\n';
  v_output := v_output || E'✅ Coluna audio_urls (TEXT[]) - [ATIVO]\n';

  v_output := v_output || E'\n3. PRÓXIMOS PASSOS:\n';
  v_output := v_output || E'-------------------\n';
  v_output := v_output || E'1. ✅ Executar fix-palestras-rpc-final.sql novamente\n';
  v_output := v_output || E'2. ✅ Atualizar tipos TypeScript (audio_urls)\n';
  v_output := v_output || E'3. ✅ Testar criação de palestra no frontend\n';

  v_output := v_output || E'\n============================================================================\n';
  v_output := v_output || E'✅ MIGRAÇÃO CONCLUÍDA!\n';
  v_output := v_output || E'============================================================================\n';

  RAISE NOTICE '%', v_output;
END $$;
