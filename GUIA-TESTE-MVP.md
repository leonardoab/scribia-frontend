# 🧪 Guia de Teste - MVP ScribIA Plus

## ✅ Checklist Pré-Teste

- [x] OPENAI_API_KEY configurada
- [x] SQL executado (bucket + RLS)
- [x] Edge Functions deployadas
- [x] Interface integrada

---

## 📝 Teste End-to-End: Áudio → Livebook

### 1️⃣ Acessar Página de Geração
```
/dashboard/gerar-livebook
```

### 2️⃣ Preencher Metadados (Opcional mas recomendado)
- **Título:** Inovações em Inteligência Artificial na Saúde
- **Palestrante:** Dr. João Silva
- **Cargo:** CTO - HealthTech Inc
- **Evento:** Summit Saúde Digital 2025

### 3️⃣ Selecionar Perfil
Escolha um perfil de teste, por exemplo:
- **Pleno Compacto** (até 4.000 palavras, direto ao ponto)

### 4️⃣ Upload de Áudio

**Opção A - Upload de Áudio (Recomendado)**
1. Clique na aba "Upload de Áudio"
2. Clique em "Iniciar Upload de Áudio"
3. Selecione um arquivo de áudio (MP3, WAV, M4A)
4. Aguarde:
   - ⏳ Upload (alguns segundos)
   - ⏳ Transcrição Whisper (1-3 minutos dependendo do tamanho)
5. ✅ Transcrição aparecerá automaticamente

**Opção B - Transcrição Manual**
1. Clique na aba "Transcrição Manual"
2. Cole ou digite o texto da transcrição
3. Ou faça upload de arquivo .txt

### 5️⃣ Gerar Livebook
1. Clique no botão "Gerar Livebook"
2. Aguarde geração (30-60 segundos com GPT-4o)
3. ✅ Livebook aparece na coluna direita

### 6️⃣ Download
Clique em:
- **`.md`** - Download em Markdown
- **`.txt`** - Download em texto puro

---

## 🎯 Cenários de Teste

### Teste 1: Áudio Pequeno (~1 min)
**Objetivo:** Validar fluxo básico rápido
- Arquivo: MP3 de 1-2 minutos
- Perfil: Pleno Compacto
- Tempo esperado: ~2-3 minutos total

### Teste 2: Áudio Médio (~10 min)
**Objetivo:** Testar performance com conteúdo real
- Arquivo: MP3 de 10 minutos
- Perfil: Senior Completo
- Tempo esperado: ~5-8 minutos total

### Teste 3: Transcrição Manual
**Objetivo:** Validar fluxo sem áudio
- Colar transcrição pronta (500+ palavras)
- Perfil: Junior Completo
- Tempo esperado: ~1 minuto

### Teste 4: Diferentes Perfis
**Objetivo:** Comparar outputs
- Usar MESMA transcrição
- Testar todos os 6 perfis
- Comparar profundidade e estilo

---

## ⚠️ Problemas Comuns

### "OPENAI_API_KEY não configurada"
**Causa:** Secret não foi adicionado
**Solução:** 
```bash
# Via Supabase CLI
supabase secrets set OPENAI_API_KEY=sk-proj-...

# Ou via Dashboard: Settings > Edge Functions > Manage secrets
```

### "Bucket audio-palestras não existe"
**Causa:** SQL não foi executado
**Solução:** Execute `setup-storage-and-rls.sql` no SQL Editor

### "Permission denied on Storage"
**Causa:** RLS policies não foram aplicadas
**Solução:** Execute novamente o SQL completo

### Transcrição demora muito
**Causa Normal:** Arquivos grandes demoram mais
**Referência:**
- 1 min de áudio = ~5-10 segundos
- 10 min de áudio = ~1-2 minutos
- 60 min de áudio = ~5-10 minutos

### Livebook incompleto ou genérico
**Possíveis causas:**
1. Transcrição muito curta (< 500 palavras)
2. Metadados não preenchidos
3. Áudio com baixa qualidade/ruído

**Solução:**
- Use transcrições com 1.000+ palavras
- Preencha todos os metadados
- Use áudios com boa qualidade

---

## 🔍 Verificar Logs

### Edge Function Logs (Supabase Dashboard)
1. Functions > transcribe-audio > Invocations
2. Functions > generate-livebook > Invocations
3. Verificar erros e tempos de execução

### Browser Console
1. Abra DevTools (F12)
2. Vá para Console
3. Verifique logs de upload e chamadas

### Database
```sql
-- Ver palestras criadas
SELECT id, titulo, palestrante, audio_url, transcricao
FROM scribia_palestras
ORDER BY criado_em DESC
LIMIT 10;

-- Ver livebooks gerados
SELECT id, tipo_resumo, status, criado_em
FROM scribia_livebooks
ORDER BY criado_em DESC
LIMIT 10;

-- Ver storage
SELECT name, metadata
FROM storage.objects
WHERE bucket_id = 'audio-palestras'
ORDER BY created_at DESC
LIMIT 10;
```

---

## 📊 Validar Sucesso

### ✅ Upload de Áudio Funcionando
- Arquivo aparece no Storage
- URL é salva em `scribia_palestras.audio_url`
- Toast de sucesso é exibido

### ✅ Transcrição Whisper Funcionando
- Texto aparece automaticamente após upload
- Texto é salvo em `scribia_palestras.transcricao`
- Toast "Transcrição concluída" aparece

### ✅ Geração de Livebook Funcionando
- Conteúdo estruturado com:
  - Metadados (título, palestrante, etc)
  - Resumo executivo
  - Sobre o palestrante
  - Tópicos principais
  - Destaques e citações
  - Conclusões
- Adaptado ao perfil escolhido
- Registro criado em `scribia_livebooks`

### ✅ Download Funcionando
- Arquivo .md baixa corretamente
- Arquivo .txt baixa corretamente
- Conteúdo completo nos downloads

---

## 💰 Monitorar Custos OpenAI

### Verificar Usage (OpenAI Platform)
1. Acesse: https://platform.openai.com/usage
2. Veja:
   - Whisper: $0.006/min
   - GPT-4o: ~$0.10 por livebook

### Estimativa de Teste
- 10 testes com áudio de 10 min cada = ~$1.50
- 20 gerações de livebook = ~$2.00
- **Total para teste completo: ~$3.50**

---

## 🎉 Próximos Passos Pós-MVP

### Features a adicionar:
1. **Preview Markdown** - Renderizar com `react-markdown`
2. **Geração de PDF** - Via biblioteca como `jspdf` ou Edge Function
3. **Lista de Livebooks** - Página com histórico completo
4. **Edição de Livebook** - Permitir editar antes do download
5. **Chunking de áudio** - Para arquivos > 25MB
6. **Streaming GPT-4o** - Mostrar geração em tempo real
7. **Compartilhamento** - Link público para livebook

---

## 📚 Referências

- [OpenAI Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [OpenAI GPT-4o API](https://platform.openai.com/docs/models/gpt-4o)
- [Supabase Storage](https://supabase.com/docs/guides/storage)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

---

**Pronto para testar! 🚀**

Execute o fluxo end-to-end e reporte qualquer erro encontrado.
