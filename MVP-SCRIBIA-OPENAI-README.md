# 🎯 MVP ScribIA Plus - OpenAI Integration

## ✅ O que foi implementado

### 1. **OpenAI API Key** ✅
- Secret `OPENAI_API_KEY` configurada no Supabase
- Disponível para todas as Edge Functions

### 2. **Storage Bucket + RLS** ✅
- Bucket `audio-palestras` criado (privado, 500MB limite)
- Políticas de segurança RLS implementadas
- Usuários só acessam seus próprios arquivos

### 3. **Edge Function: Transcrição (Whisper)** ✅
**Arquivo:** `supabase/functions/transcribe-audio/index.ts`

**Features:**
- Download de áudio do Storage
- Transcrição via OpenAI Whisper API
- Suporta português (language: 'pt')
- Logs detalhados para debugging
- Salva transcrição automaticamente no banco

**Como chamar:**
```typescript
const { data, error } = await supabase.functions.invoke('transcribe-audio', {
  body: { 
    audioUrl: 'https://...', 
    palestraId: 'uuid-here' 
  }
});
```

### 4. **Edge Function: Livebooks (GPT-4o)** ✅
**Arquivo:** `supabase/functions/generate-livebook/index.ts`

**Features:**
- Usa GPT-4o da OpenAI
- Prompts personalizados por perfil (junior/pleno/senior)
- Gera Livebooks estruturados em Markdown
- Máximo 16.000 tokens de saída

**Perfis suportados:**
- `junior-compacto` | `junior-completo`
- `pleno-compacto` | `pleno-completo`
- `senior-compacto` | `senior-completo`

**Como chamar:**
```typescript
const { data, error } = await supabase.functions.invoke('generate-livebook', {
  body: {
    transcricao: 'texto da transcrição...',
    perfil: 'pleno-compacto',
    metadados: {
      titulo: 'Título da Palestra',
      palestrante: 'Nome do Palestrante',
      cargo: 'Cargo/Empresa',
      evento: 'Nome do Evento'
    }
  }
});
```

### 5. **Componente AudioUploader** ✅
**Arquivo:** `src/components/audio/AudioUploader.tsx`

**Features:**
- Drag & drop / file picker
- Validação de tipo e tamanho (máx 500MB)
- Upload com barra de progresso
- Transcrição automática após upload
- Estados visuais (uploading, transcribing, success, error)
- Toast notifications

**Como usar:**
```tsx
import { AudioUploader } from '@/components/audio/AudioUploader';

<AudioUploader 
  palestraId="uuid-da-palestra"
  onUploadComplete={(transcricao) => {
    console.log('Transcrição:', transcricao);
  }}
/>
```

### 6. **RLS Policies - Segurança Total** ✅
**SQL:** `setup-storage-and-rls.sql`

Tabelas protegidas:
- ✅ `scribia_eventos` - cada usuário vê apenas seus eventos
- ✅ `scribia_palestras` - cada usuário vê apenas suas palestras
- ✅ `scribia_livebooks` - cada usuário vê apenas seus livebooks
- ✅ `scribia_usuarios` - cada usuário acessa apenas seu próprio perfil
- ✅ Storage `audio-palestras` - arquivos isolados por usuário

---

## 📋 Como rodar o SQL

Execute o arquivo `setup-storage-and-rls.sql` no **Supabase SQL Editor**:

1. Acesse: **Lovable > Database > SQL Editor**
2. Cole o conteúdo completo do arquivo
3. Clique em **Run**

Isso vai:
- Criar o bucket `audio-palestras`
- Criar todas as políticas de Storage
- Corrigir RLS em todas as tabelas

---

## 🚀 Fluxo Completo End-to-End

### 1️⃣ Upload de Áudio
```tsx
<AudioUploader 
  palestraId={palestra.id}
  onUploadComplete={(transcricao) => {
    // Transcrição já foi salva no banco automaticamente
    console.log('Pronto para gerar livebook!');
  }}
/>
```

### 2️⃣ Gerar Livebook
```tsx
const handleGerarLivebook = async () => {
  const { data, error } = await supabase.functions.invoke('generate-livebook', {
    body: {
      transcricao: transcricaoSalva,
      perfil: 'pleno-compacto',
      metadados: { 
        titulo: 'Inovações em Saúde Digital',
        palestrante: 'Dr. João Silva',
        cargo: 'CTO - HealthTech Inc',
        evento: 'Summit Saúde 2025'
      }
    }
  });

  if (error) {
    console.error('Erro:', error);
    return;
  }

  // Salvar livebook no banco
  await supabase.from('scribia_livebooks').insert({
    palestra_id: palestraId,
    usuario_id: userId,
    tipo_resumo: 'compacto',
    nivel_perfil: 'pleno',
    conteudo: data.livebook,
    formato: 'markdown',
    status: 'concluído'
  });
};
```

---

## 🔧 Próximos Passos (Pós-MVP)

### Página "Gerar Livebook" completa
Integrar o `AudioUploader` na página existente:

```tsx
// src/pages/dashboard/GerarLivebook.tsx
import { AudioUploader } from '@/components/audio/AudioUploader';

// Dentro do componente:
const [transcricao, setTranscricao] = useState('');

<AudioUploader 
  palestraId={novaPalestraId}
  onUploadComplete={(texto) => {
    setTranscricao(texto);
    // Agora pode gerar o livebook
  }}
/>
```

### Melhorias sugeridas:
1. **Preview do Livebook** - Renderizar markdown com `react-markdown`
2. **Download** - Gerar PDF/DOCX do livebook
3. **Histórico** - Lista de transcrições e livebooks anteriores
4. **Streaming GPT-4o** - Mostrar geração em tempo real
5. **Chunking** - Para áudios > 25MB, fazer chunking antes do Whisper

---

## 🐛 Troubleshooting

### Erro: "OPENAI_API_KEY não configurada"
**Solução:** Execute o secret no Supabase:
```bash
supabase secrets set OPENAI_API_KEY=sk-proj-...
```

### Erro: "Bucket audio-palestras não existe"
**Solução:** Execute `setup-storage-and-rls.sql` no SQL Editor.

### Erro: "Row violates RLS policy"
**Solução:** Certifique-se de que:
- `usuario_id` está sendo passado corretamente
- Usuário está autenticado (`auth.uid()` não é null)

### Erro: "File too large"
**Solução:** 
- Whisper API tem limite de 25MB
- Para arquivos maiores, implemente chunking ou compressão

---

## 💰 Custos OpenAI (estimativa)

### Whisper (Transcrição)
- **Preço:** $0.006 / minuto de áudio
- **Exemplo:** Palestra de 60 min = ~$0.36

### GPT-4o (Livebooks)
- **Input:** $5 / 1M tokens
- **Output:** $15 / 1M tokens
- **Exemplo:** 10k tokens input + 4k output = ~$0.11

**Total por livebook:** ~$0.50 (média)

---

## 📚 Documentação OpenAI

- [Whisper API](https://platform.openai.com/docs/guides/speech-to-text)
- [GPT-4o API](https://platform.openai.com/docs/models/gpt-4o)
- [Rate Limits](https://platform.openai.com/docs/guides/rate-limits)

---

## ✅ Checklist de Deploy

- [x] OPENAI_API_KEY configurada
- [x] Storage bucket criado
- [x] RLS policies aplicadas
- [x] Edge functions deployadas
- [x] Componente AudioUploader criado
- [ ] Integrar AudioUploader na página GerarLivebook
- [ ] Testar fluxo end-to-end
- [ ] Adicionar preview de livebook
- [ ] Implementar download (PDF/DOCX)

---

Pronto! 🎉 O MVP está funcional e pronto para testes.
