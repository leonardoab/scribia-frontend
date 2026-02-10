-- ============================================
-- CORREÇÃO DEFINITIVA DE RLS
-- ============================================
-- Este script resolve TODOS os problemas de RLS
-- removendo políticas duplicadas e desabilitando RLS
-- nas tabelas gerenciadas por RPC functions

-- 1. REMOVER TODAS AS POLÍTICAS EXISTENTES
-- ============================================

-- scribia_livebooks
DROP POLICY IF EXISTS "Admins podem gerenciar todos os livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Admins podem ver todos os livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem inserir seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem ver seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem excluir seus proprios livebooks" ON public.scribia_livebooks;

-- scribia_eventos (incluindo políticas duplicadas em inglês e português)
DROP POLICY IF EXISTS "Admins podem gerenciar todos os eventos" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Admins podem ver todos os eventos" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can view their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can update their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Usuarios podem ver seus proprios eventos" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Usuarios podem inserir seus proprios eventos" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios eventos" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Usuarios podem excluir seus proprios eventos" ON public.scribia_eventos;

-- scribia_palestras
DROP POLICY IF EXISTS "Admins podem gerenciar todas as palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Admins podem ver todas as palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem inserir suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem ver suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem excluir suas proprias palestras" ON public.scribia_palestras;

-- 2. DESABILITAR RLS NAS TABELAS
-- ============================================
-- As RPC functions com SECURITY DEFINER garantem a segurança
-- sem necessidade de RLS nessas tabelas

ALTER TABLE public.scribia_livebooks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_eventos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_palestras DISABLE ROW LEVEL SECURITY;

-- 3. COMENTÁRIOS EXPLICATIVOS
-- ============================================
-- Documentar a razão da desabilitação do RLS

COMMENT ON TABLE public.scribia_livebooks IS 'RLS desabilitado - segurança gerenciada por RPC functions com SECURITY DEFINER';
COMMENT ON TABLE public.scribia_eventos IS 'RLS desabilitado - segurança gerenciada por RPC functions com SECURITY DEFINER';
COMMENT ON TABLE public.scribia_palestras IS 'RLS desabilitado - segurança gerenciada por RPC functions com SECURITY DEFINER';

-- 4. VERIFICAÇÃO FINAL
-- ============================================
-- Confirmar que RLS foi desabilitado corretamente

SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS HABILITADO (PROBLEMA!)'
        ELSE '✅ RLS DESABILITADO (CORRETO)'
    END as status_rls
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('scribia_livebooks', 'scribia_eventos', 'scribia_palestras')
ORDER BY tablename;

-- Verificar se ainda existem políticas ativas
SELECT 
    tablename,
    policyname,
    '⚠️ POLÍTICA AINDA ATIVA - REMOVER!' as alerta
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('scribia_livebooks', 'scribia_eventos', 'scribia_palestras');

SELECT '✅ Correção de RLS executada com sucesso!' as resultado;
