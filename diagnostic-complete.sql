-- ============================================
-- DIAGNÓSTICO COMPLETO DO SISTEMA SCRIBIA
-- ============================================
-- Execute este script PRIMEIRO para verificar o estado atual

-- ============================================
-- 1. VERIFICAR STATUS DO RLS
-- ============================================
SELECT 
    '=== STATUS DO RLS ===' as secao,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ATIVO - PROBLEMA!'
        ELSE '✅ RLS DESATIVADO - OK'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos')
ORDER BY tablename;

-- ============================================
-- 2. VERIFICAR POLÍTICAS RLS ATIVAS
-- ============================================
SELECT 
    '=== POLÍTICAS RLS ===' as secao,
    tablename,
    policyname,
    '⚠️ POLÍTICA ATIVA - DEVE SER REMOVIDA' as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos');

-- ============================================
-- 3. VERIFICAR FUNÇÕES RPC EXISTENTES
-- ============================================
SELECT 
    '=== FUNÇÕES RPC ===' as secao,
    p.proname as nome_funcao,
    CASE 
        WHEN p.proname IS NOT NULL THEN '✅ EXISTE'
        ELSE '❌ NÃO EXISTE'
    END as status,
    pg_get_functiondef(p.oid) LIKE '%SECURITY DEFINER%' as tem_security_definer
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
    )
ORDER BY p.proname;

-- ============================================
-- 4. VERIFICAR PERMISSÕES DAS FUNÇÕES
-- ============================================
SELECT 
    '=== PERMISSÕES ===' as secao,
    p.proname as nome_funcao,
    CASE 
        WHEN p.proacl IS NULL THEN 'Permissões padrão (public)'
        ELSE p.proacl::text
    END as permissoes
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
    AND p.proname LIKE 'scribia_%'
ORDER BY p.proname;

-- ============================================
-- 5. RESUMO FINAL
-- ============================================
SELECT 
    '=== RESUMO ===' as secao,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos') AND rowsecurity = true) > 0
        THEN '❌ RLS ainda está ativo em algumas tabelas - Execute fix-rls-step-by-step.sql'
        ELSE '✅ RLS desabilitado corretamente'
    END as status_rls,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.proname IN ('scribia_create_palestra', 'scribia_create_evento', 'scribia_create_livebook')) < 3
        THEN '❌ Funções RPC estão faltando - Execute deploy-all-rpc-functions.sql'
        ELSE '✅ Funções RPC principais existem'
    END as status_funcoes;
