# 🔧 Instruções para Corrigir Funções RPC de Eventos

## Problema Identificado
As funções RPC de eventos no banco de dados não correspondem à estrutura esperada pela aplicação.

## Solução: Executar Script de Correção

### Passo 1️⃣: Acesse o Supabase Dashboard
1. Abra o [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione seu projeto **ScribIA**
3. No menu lateral, clique em **SQL Editor**

### Passo 2️⃣: Execute o Script de Correção
1. Clique em **+ New Query**
2. Copie **TODO O CONTEÚDO** do arquivo `fix-eventos-rpc.sql` deste projeto
3. Cole no editor SQL
4. Clique em **RUN** (ou pressione `Ctrl+Enter` / `Cmd+Enter`)

### Passo 3️⃣: Verifique o Resultado
Você deve ver mensagens de sucesso no console, incluindo:
- ✅ Funções criadas/atualizadas
- ✅ Lista das funções com seus argumentos
- ✅ "Funções RPC para eventos criadas com sucesso! ✅"

---

## 🔍 Verificação Manual (Opcional)

Caso queira confirmar que tudo está correto, execute esta query no SQL Editor:

```sql
-- Verificar funções de eventos criadas
SELECT 
    proname as function_name,
    pg_get_function_identity_arguments(oid) as arguments,
    prosecdef as is_security_definer
FROM pg_proc 
WHERE proname LIKE 'scribia_%evento%'
ORDER BY proname;
```

**Resultado esperado:** 4 funções devem aparecer:
1. `scribia_create_evento(p_usuario_id uuid, p_nome_evento text, ...)`
2. `scribia_delete_evento(p_evento_id uuid, p_usuario_id uuid)`
3. `scribia_get_eventos(p_usuario_id uuid)`
4. `scribia_update_evento(p_evento_id uuid, p_usuario_id uuid, ...)`

---

## ✅ Após Executar o Script

1. Volte para a aplicação ScribIA
2. Recarregue a página (F5)
3. Tente criar um novo evento
4. O erro deve ter sido resolvido! 🎉

---

## ⚠️ Problemas?

Se o erro persistir:
1. Verifique se executou **TODO** o script `fix-eventos-rpc.sql`
2. Confirme que não houve erros no console SQL do Supabase
3. Verifique se está no projeto correto do Supabase
4. Tente fazer logout e login novamente na aplicação
