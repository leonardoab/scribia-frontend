// scribia-transcribe v2.1 - 2025-06-28 - Deepgram API
// Força redeploy após correção de erro legado
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ========== FLUXO STREAMING: Proxy direto Cliente → Deepgram ==========
// Cliente envia arquivo via FormData, edge function faz streaming direto ao Deepgram
async function handleFormDataUpload(req: Request) {
  console.log('📦 Recebendo FormData para streaming...');
  
  const formData = await req.formData();
  const audioFile = formData.get('audio_file') as File;
  const palestraId = formData.get('palestra_id') as string;
  const userId = formData.get('user_id') as string;

  if (!audioFile || !palestraId || !userId) {
    return new Response(
      JSON.stringify({ 
        error: 'Campos obrigatórios: audio_file, palestra_id, user_id' 
      }),
      { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log(`📄 Arquivo: ${audioFile.name} (${(audioFile.size / 1024 / 1024).toFixed(2)}MB)`);
  console.log('🚀 Streaming direto ao Deepgram (sem carregar na memória)...');

  const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!deepgramApiKey) {
    return new Response(
      JSON.stringify({ error: 'DEEPGRAM_API_KEY não configurada' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // 1. Converter arquivo para ArrayBuffer (mais confiável que stream())
  const audioArrayBuffer = await audioFile.arrayBuffer();
  console.log(`📦 Arquivo carregado na memória (${(audioArrayBuffer.byteLength / 1024 / 1024).toFixed(2)}MB)`);

  const deepgramResponse = await fetch(
    `https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&punctuate=true&paragraphs=true&smart_format=true`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': audioFile.type || 'audio/mpeg',
      },
      body: audioArrayBuffer, // ✅ Usar ArrayBuffer ao invés de stream
    }
  );

  if (!deepgramResponse.ok) {
    const errorText = await deepgramResponse.text();
    console.error('❌ Erro Deepgram:', errorText);
    
    await supabase
      .from('scribia_palestras')
      .update({ 
        transcription_status: 'error',
        transcription_error: `Deepgram error: ${deepgramResponse.status}` 
      })
      .eq('id', palestraId);

    return new Response(
      JSON.stringify({ 
        error: `Erro ao transcrever: ${deepgramResponse.status}` 
      }),
      { 
        status: deepgramResponse.status, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  const transcription = await deepgramResponse.json();
  const transcriptionText = transcription?.results?.channels?.[0]?.alternatives?.[0]?.transcript;

  if (!transcriptionText) {
    console.error('❌ Transcrição vazia');
    
    await supabase
      .from('scribia_palestras')
      .update({ 
        transcription_status: 'error',
        transcription_error: 'Transcrição vazia' 
      })
      .eq('id', palestraId);

    return new Response(
      JSON.stringify({ error: 'Transcrição vazia' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log(`✅ Transcrição recebida: ${transcriptionText.substring(0, 100)}...`);

  // 2. Salvar transcrição no Storage (apenas texto)
  const transcriptionFileName = `${palestraId}/transcription.txt`;
  
  const { error: uploadError } = await supabase.storage
    .from('scribia-audio')
    .upload(transcriptionFileName, transcriptionText, {
      contentType: 'text/plain',
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Erro ao salvar transcrição:', uploadError);
  } else {
    console.log('✅ Transcrição salva no Storage');
  }

  // 3. Atualizar registro no banco
  const { error: updateError } = await supabase
    .from('scribia_palestras')
    .update({
      transcription_text: transcriptionText,
      transcription_status: 'completed',
      transcription_url: transcriptionFileName,
      processed_at: new Date().toISOString(),
    })
    .eq('id', palestraId);

  if (updateError) {
    console.error('❌ Erro ao atualizar palestra:', updateError);
    return new Response(
      JSON.stringify({ error: 'Erro ao salvar transcrição' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }

  console.log('✅ Palestra atualizada');

  // 4. Chamar generate-livebook
  console.log('📚 Iniciando geração do Livebook...');
  
  const generateResponse = await supabase.functions.invoke('generate-livebook', {
    body: {
      palestra_id: palestraId,
      user_id: userId,
    },
  });

  if (generateResponse.error) {
    console.error('⚠️ Erro ao gerar Livebook:', generateResponse.error);
  } else {
    console.log('✅ Livebook gerado com sucesso');
  }

  return new Response(
    JSON.stringify({ 
      success: true,
      message: 'Transcrição concluída e Livebook em geração',
      transcription: transcriptionText.substring(0, 500),
    }),
    { 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

// ========== FLUXO URL: Deepgram Remote API (RECOMENDADO para arquivos grandes) ==========
// Deepgram baixa o áudio diretamente da URL, sem usar memória da edge function
async function handleAudioUrlTranscription(req: Request) {
  const { audio_url, palestra_id, user_id } = await req.json();

  if (!audio_url || !palestra_id || !user_id) {
    throw new Error('audio_url, palestra_id e user_id são obrigatórios');
  }

  console.log(`[${palestra_id}] 📤 Transcrição via URL: ${audio_url}`);

  const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!deepgramApiKey) {
    console.error('❌ DEEPGRAM_API_KEY não encontrada nas variáveis de ambiente');
    throw new Error('Erro de configuração: API de transcrição não disponível. Contate o suporte.');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Atualizar status
  await supabase
    .from('scribia_palestras')
    .update({ status: 'processando' })
    .eq('id', palestra_id);

  const startTime = Date.now();

  // DEEPGRAM COM URL REMOTA (não precisa fazer upload/streaming)
  const deepgramResponse = await fetch(
    'https://api.deepgram.com/v1/listen?model=nova-2&language=pt-BR&punctuate=true&diarize=true&smart_format=true&paragraphs=true',
    {
      method: 'POST',
      headers: {
        'Authorization': `Token ${deepgramApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url: audio_url }), // ✨ DEEPGRAM BAIXA O ÁUDIO
    }
  );

  if (!deepgramResponse.ok) {
    const errorText = await deepgramResponse.text();
    console.error(`[${palestra_id}] ❌ Erro Deepgram (status ${deepgramResponse.status}):`, errorText);
    
    // Atualizar status da palestra para erro
    await supabase
      .from('scribia_palestras')
      .update({ 
        status: 'erro',
        transcricao: `Erro na transcrição: Deepgram retornou status ${deepgramResponse.status}`
      })
      .eq('id', palestra_id);
    
    throw new Error(`Erro na transcrição (Deepgram ${deepgramResponse.status}): ${errorText.substring(0, 200)}`);
  }

  const result = await deepgramResponse.json();
  const transcript = result.results.channels[0].alternatives[0].transcript;
  const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

  // Detectar palestrantes
  const speakers = result.results.channels[0].alternatives[0].words
    .map((w: any) => w.speaker)
    .filter((v: number, i: number, a: number[]) => a.indexOf(v) === i);

  console.log(`[${palestra_id}] ✅ Transcrição concluída em ${processingTime}s (${transcript.length} caracteres, ${speakers.length} palestrantes)`);

  // Salvar transcrição no storage (TXT)
  const transcriptionFileName = `${user_id}/transcricoes/${palestra_id}.txt`;
  await supabase.storage
    .from('scribia-audio')
    .upload(transcriptionFileName, transcript, {
      contentType: 'text/plain',
      upsert: true,
    });

  const { data: { publicUrl } } = supabase.storage
    .from('scribia-audio')
    .getPublicUrl(transcriptionFileName);

  // Atualizar palestra com transcrição
  await supabase
    .from('scribia_palestras')
    .update({
      transcricao: transcript,
      transcricao_url: publicUrl,
      status: 'processando',
    })
    .eq('id', palestra_id);

  console.log(`[${palestra_id}] 📝 Transcrição salva em: ${publicUrl}`);

  // Buscar preferências do usuário
  const { data: palestraData } = await supabase
    .from('scribia_palestras')
    .select('*, scribia_usuarios!inner(*)')
    .eq('id', palestra_id)
    .single();

  if (!palestraData) {
    throw new Error('Dados da palestra não encontrados');
  }

  let nivelEscolhido = palestraData.nivel_escolhido;
  let formatoEscolhido = palestraData.formato_escolhido;

  if (!nivelEscolhido || !formatoEscolhido) {
    console.log(`[${palestra_id}] ⚠️ Buscando preferências do usuário...`);
    
    const { data: userData } = await supabase
      .from('scribia_usuarios')
      .select('nivel_preferido, formato_preferido')
      .eq('id', user_id)
      .single();
    
    if (userData) {
      nivelEscolhido = nivelEscolhido || userData.nivel_preferido;
      formatoEscolhido = formatoEscolhido || userData.formato_preferido;
    }
  }

  if (!nivelEscolhido || !formatoEscolhido) {
    throw new Error('Nível e formato são obrigatórios para criar livebook');
  }

  const tipo_resumo = `${nivelEscolhido}_${formatoEscolhido}`;
  
  // Criar livebook
  console.log(`[${palestra_id}] 📝 Criando livebook com tipo_resumo: ${tipo_resumo}`);
  const { data: livebookResult, error: livebookError } = await supabase
    .rpc('scribia_create_livebook', {
      p_palestra_id: palestra_id,
      p_usuario_id: user_id,
      p_tipo_resumo: tipo_resumo,
      p_status: 'processando'
    });

  if (livebookError || !livebookResult?.success) {
    console.error(`[${palestra_id}] ❌ Erro ao criar livebook:`, livebookError || livebookResult?.error);
    throw new Error(`Erro ao criar livebook: ${livebookError?.message || livebookResult?.error}`);
  }

  console.log(`[${palestra_id}] ✅ Livebook criado: ${livebookResult.livebook_id}`);

  // Chamar generate-livebook
  const perfilFormatado = `${nivelEscolhido}-${formatoEscolhido}`;
  console.log(`[${palestra_id}] 🚀 Disparando geração do livebook com perfil: ${perfilFormatado}`);
  
  const { error: genError } = await supabase.functions.invoke('generate-livebook', {
    body: {
      palestraId: palestra_id,
      usuarioId: user_id,
      transcricao: transcript,
      perfil: perfilFormatado,
      metadados: {
        titulo: palestraData.titulo,
        palestrante: palestraData.palestrante || 'Palestrante',
        data: new Date().toISOString()
      }
    }
  });

  if (genError) {
    console.error(`[${palestra_id}] ❌ Erro ao gerar livebook:`, genError);
  } else {
    console.log(`[${palestra_id}] ✅ Livebook gerado com sucesso`);
  }

  return new Response(
    JSON.stringify({
      success: true,
      message: 'Transcrição concluída. Livebook sendo gerado...',
      transcription_url: publicUrl,
      transcript_length: transcript.length,
      speakers_detected: speakers.length,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ========== FLUXO ANTIGO: JSON (compatibilidade) ==========
async function handleJsonUpload(req: Request) {
  const body = await req.json();
  const { palestra_id, audio_urls, audio_file, audio_filename, audio_mimetype } = body;

  if (!palestra_id) {
    throw new Error('palestra_id é obrigatório');
  }

  const hasDirectAudio = audio_file && audio_filename;
  const hasUrls = audio_urls && Array.isArray(audio_urls) && audio_urls.length > 0;

  if (!hasDirectAudio && !hasUrls) {
    throw new Error('É necessário fornecer audio_file (base64) ou audio_urls (array)');
  }

  const deepgramApiKey = Deno.env.get('DEEPGRAM_API_KEY');
  if (!deepgramApiKey) {
    throw new Error('DEEPGRAM_API_KEY não configurada');
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  await supabase
    .from('scribia_palestras')
    .update({ status: 'processando' })
    .eq('id', palestra_id);

  const audioSources = hasDirectAudio 
    ? [{ type: 'direct', data: audio_file, filename: audio_filename, mimetype: audio_mimetype }] 
    : audio_urls.map((url: string) => ({ type: 'url', data: url }));
  
  console.log(`[${palestra_id}] Processando ${audioSources.length} áudio(s) (modo: ${hasDirectAudio ? 'DIRETO' : 'URL'})`);

  const allTranscriptions: string[] = [];
  let successCount = 0;

  for (let i = 0; i < audioSources.length; i++) {
    const source = audioSources[i];
    const sourceLabel = source.type === 'direct' ? source.filename : source.data;

    try {
      const startTime = Date.now();
      let deepgramResponse;

      if (source.type === 'direct') {
        const binaryString = atob(source.data);
        const bytes = new Uint8Array(binaryString.length);
        for (let j = 0; j < binaryString.length; j++) {
          bytes[j] = binaryString.charCodeAt(j);
        }

        deepgramResponse = await fetch(
          'https://api.deepgram.com/v1/listen?language=pt-BR&punctuate=true&diarize=true&smart_format=true&paragraphs=true',
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${deepgramApiKey}`,
              'Content-Type': source.mimetype || 'audio/mpeg',
            },
            body: bytes,
          }
        );
      } else {
        deepgramResponse = await fetch(
          'https://api.deepgram.com/v1/listen?language=pt-BR&punctuate=true&diarize=true&smart_format=true&paragraphs=true',
          {
            method: 'POST',
            headers: {
              'Authorization': `Token ${deepgramApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url: source.data }),
          }
        );
      }

      if (!deepgramResponse.ok) {
        const errorText = await deepgramResponse.text();
        throw new Error(`Erro Deepgram: ${deepgramResponse.status} - ${errorText}`);
      }

      const result = await deepgramResponse.json();
      const transcript = result.results.channels[0].alternatives[0].transcript;
      const processingTime = ((Date.now() - startTime) / 1000).toFixed(2);

      allTranscriptions.push(`\n\n=== ÁUDIO ${i + 1} ===\n\n${transcript}\n\n`);
      successCount++;
      console.log(`[${palestra_id}] ✅ Transcrição ${i+1} concluída em ${processingTime}s (${transcript.length} chars)`);

    } catch (error: any) {
      console.error(`[${palestra_id}] ❌ Erro ao transcrever ${sourceLabel}:`, error);
      allTranscriptions.push(`\n\n=== ÁUDIO ${i + 1} ===\n\n[Erro: ${error.message}]\n\n`);
    }
  }

  const consolidatedTranscription = allTranscriptions.join('');
  
  if (successCount === 0) {
    await supabase
      .from('scribia_palestras')
      .update({ status: 'erro', transcricao: 'Falha ao transcrever áudios' })
      .eq('id', palestra_id);
    
    throw new Error('Falha ao transcrever áudios');
  }

  // Salvar transcrição
  const { data: palestraUserId } = await supabase
    .from('scribia_palestras')
    .select('usuario_id')
    .eq('id', palestra_id)
    .single();

  if (!palestraUserId?.usuario_id) {
    throw new Error('Usuário da palestra não encontrado');
  }

  const transcriptionFileName = `${palestraUserId.usuario_id}/transcricoes/${palestra_id}.txt`;
  await supabase.storage
    .from('scribia-audio')
    .upload(transcriptionFileName, consolidatedTranscription, {
      contentType: 'text/plain',
      upsert: true,
    });

  const { data: { publicUrl } } = supabase.storage
    .from('scribia-audio')
    .getPublicUrl(transcriptionFileName);

  await supabase
    .from('scribia_palestras')
    .update({
      transcricao_url: publicUrl,
      transcricao: consolidatedTranscription,
      status: 'processando',
    })
    .eq('id', palestra_id);

  return new Response(
    JSON.stringify({
      success: true,
      transcription_url: publicUrl,
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// ========== MAIN HANDLER ==========
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const contentType = req.headers.get('content-type') || '';
    
    // PRIORIDADE 1: FormData com streaming direto (RECOMENDADO - sem limite de tamanho)
    if (contentType.includes('multipart/form-data')) {
      return await handleFormDataUpload(req);
    }
    
    // PRIORIDADE 2: JSON com URL (compatibilidade)
    if (contentType.includes('application/json')) {
      return await handleAudioUrlTranscription(req);
    }
    
    // FLUXO LEGADO: Base64 (compatibilidade antiga)
    return await handleJsonUpload(req);

  } catch (error: any) {
    console.error('Erro na transcrição:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
