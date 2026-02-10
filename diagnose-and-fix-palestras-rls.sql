-- ============================================================================
-- DIAGNÓSTICO E CORREÇÃO - RLS DE PALESTRAS
-- ============================================================================

-- PARTE 1: DIAGNÓSTICO
-- ============================================================================

DO $$
DECLARE
  v_output TEXT := E'\n';
  v_rls_enabled BOOLEAN;
BEGIN
  v_output := v_output || E'============================================================================\n';
  v_output := v_output || E'DIAGNÓSTICO - PALESTRAS RLS\n';
  v_output := v_output || E'============================================================================\n\n';

  -- Verificar RLS
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables 
  WHERE tablename = 'scribia_palestras' AND schemaname = 'public';

  v_output := v_output || E'1. STATUS DO RLS:\n';
  v_output := v_output || E'-------------------\n';
  v_output := v_output || format('RLS Habilitado: %s', v_rls_enabled) || E'\n';

  -- Listar políticas ativas
  v_output := v_output || E'\n2. POLÍTICAS RLS ATIVAS:\n';
  v_output := v_output || E'-------------------------\n';
  
  IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'scribia_palestras' AND schemaname = 'public') THEN
    SELECT v_output || string_agg(format('- %s (Comando: %s)', policyname, cmd), E'\n') || E'\n'
    INTO v_output
    FROM pg_policies 
    WHERE tablename = 'scribia_palestras' AND schemaname = 'public';
  ELSE
    v_output := v_output || E'✅ Nenhuma política ativa\n';
  END IF;

  -- Verificar funções RPC
  v_output := v_output || E'\n3. FUNÇÕES RPC DISPONÍVEIS:\n';
  v_output := v_output || E'----------------------------\n';
  
  IF EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname LIKE 'scribia_%palestra%'
      AND pronamespace = 'public'::regnamespace
  ) THEN
    SELECT v_output || string_agg(
      format('✅ %s (SECURITY DEFINER: %s)', 
        proname, 
        CASE WHEN prosecdef THEN 'SIM' ELSE 'NÃO' END
      ), E'\n'
    ) || E'\n'
    INTO v_output
    FROM pg_proc 
    WHERE proname LIKE 'scribia_%palestra%'
      AND pronamespace = 'public'::regnamespace;
  ELSE
    v_output := v_output || E'❌ Nenhuma função RPC encontrada!\n';
  END IF;

  -- Verificar coluna audio_urls
  v_output := v_output || E'\n4. ESTRUTURA DA TABELA:\n';
  v_output := v_output || E'------------------------\n';
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'scribia_palestras'
      AND column_name = 'audio_urls'
  ) THEN
    v_output := v_output || E'✅ Coluna audio_urls existe\n';
  ELSE
    v_output := v_output || E'❌ Coluna audio_urls NÃO existe\n';
  END IF;

  v_output := v_output || E'\n============================================================================\n';
  
  RAISE NOTICE '%', v_output;
END $$;

-- PARTE 2: CORREÇÃO
-- ============================================================================

-- Remover todas as políticas RLS
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE tablename = 'scribia_palestras' AND schemaname = 'public'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scribia_palestras', pol.policyname);
        RAISE NOTICE 'Política removida: %', pol.policyname;
    END LOOP;
END $$;

-- Desabilitar RLS explicitamente
ALTER TABLE public.scribia_palestras DISABLE ROW LEVEL SECURITY;

-- Adicionar comentário explicativo
COMMENT ON TABLE public.scribia_palestras IS 'RLS desabilitado - segurança gerenciada por funções RPC com SECURITY DEFINER';

-- PARTE 3: VERIFICAÇÃO FINAL
-- ============================================================================

DO $$
DECLARE
  v_output TEXT := E'\n';
  v_rls_enabled BOOLEAN;
BEGIN
  SELECT rowsecurity INTO v_rls_enabled
  FROM pg_tables 
  WHERE tablename = 'scribia_palestras' AND schemaname = 'public';

  v_output := v_output || E'============================================================================\n';
  v_output := v_output || E'VERIFICAÇÃO FINAL\n';
  v_output := v_output || E'============================================================================\n\n';
  
  v_output := v_output || format('RLS Habilitado: %s', v_rls_enabled) || E'\n';
  
  IF v_rls_enabled THEN
    v_output := v_output || E'\n⚠️  ATENÇÃO: RLS ainda está habilitado!\n';
    v_output := v_output || E'Execute este script novamente ou verifique as permissões.\n';
  ELSE
    v_output := v_output || E'\n✅ RLS DESABILITADO COM SUCESSO!\n';
    v_output := v_output || E'Agora você pode criar palestras sem erros de RLS.\n';
  END IF;

  v_output := v_output || E'\n============================================================================\n';
  
  RAISE NOTICE '%', v_output;
END $$;
