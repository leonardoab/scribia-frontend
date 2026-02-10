-- ============================================
-- CORREÇÃO RLS - PASSO A PASSO
-- ============================================
-- Execute este script APÓS rodar o diagnóstico

-- PASSO 1: Desabilitar RLS
ALTER TABLE public.scribia_palestras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_livebooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_eventos DISABLE ROW LEVEL SECURITY;

-- PASSO 2: Remover TODAS as políticas da tabela scribia_palestras
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'scribia_palestras'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scribia_palestras', pol.policyname);
    END LOOP;
END $$;

-- PASSO 3: Remover TODAS as políticas da tabela scribia_livebooks
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'scribia_livebooks'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scribia_livebooks', pol.policyname);
    END LOOP;
END $$;

-- PASSO 4: Remover TODAS as políticas da tabela scribia_eventos
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'scribia_eventos'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON public.scribia_eventos', pol.policyname);
    END LOOP;
END $$;

-- PASSO 5: Adicionar comentários explicativos
COMMENT ON TABLE public.scribia_palestras IS 'RLS desabilitado - segurança gerenciada por RPC functions';
COMMENT ON TABLE public.scribia_livebooks IS 'RLS desabilitado - segurança gerenciada por RPC functions';
COMMENT ON TABLE public.scribia_eventos IS 'RLS desabilitado - segurança gerenciada por RPC functions';

-- VERIFICAÇÃO FINAL
SELECT '✅ CORREÇÃO CONCLUÍDA!' as status;

-- Verificar resultado
SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ AINDA COM PROBLEMA'
        ELSE '✅ CORRIGIDO'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos')
ORDER BY tablename;
