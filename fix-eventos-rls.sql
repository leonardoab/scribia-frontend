-- Corrigir políticas RLS para a tabela scribia_eventos
-- Execute este script no Supabase Dashboard > SQL Editor

-- 1. Remover políticas antigas se existirem
DROP POLICY IF EXISTS "Users can view their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can insert their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can update their own events" ON public.scribia_eventos;
DROP POLICY IF EXISTS "Users can delete their own events" ON public.scribia_eventos;

-- 2. Habilitar RLS na tabela (se ainda não estiver habilitado)
ALTER TABLE public.scribia_eventos ENABLE ROW LEVEL SECURITY;

-- 3. Criar política para SELECT - usuários podem ver apenas seus próprios eventos
CREATE POLICY "Users can view their own events"
ON public.scribia_eventos
FOR SELECT
TO authenticated
USING (auth.uid() = usuario_id);

-- 4. Criar política para INSERT - usuários podem criar eventos para si mesmos
CREATE POLICY "Users can insert their own events"
ON public.scribia_eventos
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = usuario_id);

-- 5. Criar política para UPDATE - usuários podem atualizar apenas seus próprios eventos
CREATE POLICY "Users can update their own events"
ON public.scribia_eventos
FOR UPDATE
TO authenticated
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 6. Criar política para DELETE - usuários podem deletar apenas seus próprios eventos
CREATE POLICY "Users can delete their own events"
ON public.scribia_eventos
FOR DELETE
TO authenticated
USING (auth.uid() = usuario_id);

-- 7. Verificar as políticas criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename = 'scribia_eventos'
ORDER BY policyname;

SELECT 'Políticas RLS para eventos criadas com sucesso! ✅' as status;
