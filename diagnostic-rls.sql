-- ============================================
-- DIAGNÓSTICO RLS - Executar PRIMEIRO
-- ============================================
-- Execute este script para verificar o estado atual do RLS

SELECT 
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ATIVO - PROBLEMA!'
        ELSE '✅ RLS DESATIVADO - OK'
    END as status
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos')
ORDER BY tablename;

-- Verificar políticas RLS ativas
SELECT 
    tablename,
    policyname,
    '⚠️ POLÍTICA ATIVA' as status
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('scribia_palestras', 'scribia_livebooks', 'scribia_eventos');
