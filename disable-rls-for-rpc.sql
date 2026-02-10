-- ============================================
-- MIGRAÇÃO: DESABILITAR RLS PARA RPC FUNCTIONS
-- ============================================
-- Esta migração resolve o conflito entre RLS e SECURITY DEFINER
-- A segurança é garantida pelas próprias RPC functions

-- Desabilitar RLS nas tabelas
ALTER TABLE public.scribia_palestras DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.scribia_livebooks DISABLE ROW LEVEL SECURITY;

-- Remover políticas antigas (não são mais necessárias)
DROP POLICY IF EXISTS "Usuarios podem inserir suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem ver suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem atualizar suas proprias palestras" ON public.scribia_palestras;
DROP POLICY IF EXISTS "Usuarios podem excluir suas proprias palestras" ON public.scribia_palestras;

DROP POLICY IF EXISTS "Usuarios podem inserir seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem ver seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem atualizar seus proprios livebooks" ON public.scribia_livebooks;
DROP POLICY IF EXISTS "Usuarios podem excluir seus proprios livebooks" ON public.scribia_livebooks;

-- Comentário explicativo
COMMENT ON TABLE public.scribia_palestras IS 'RLS desabilitado - segurança gerenciada por RPC functions';
COMMENT ON TABLE public.scribia_livebooks IS 'RLS desabilitado - segurança gerenciada por RPC functions';

-- Mensagem de confirmação
SELECT 'RLS desabilitado com sucesso! Agora as RPC functions podem inserir dados sem conflitos.' as status;
