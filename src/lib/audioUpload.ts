import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB

/**
 * Calcula tempo estimado de processamento baseado no tamanho do arquivo
 */
export function estimateProcessingTime(fileSize: number): string {
  // Deepgram: ~1min por 10MB (transcrição)
  const transcriptionMinutes = Math.ceil((fileSize / (10 * 1024 * 1024)));
  
  // LLM: ~30s por transcrição (geração)
  const generationMinutes = 1;
  
  const totalMinutes = transcriptionMinutes + generationMinutes;
  
  if (totalMinutes < 2) return 'menos de 2 minutos';
  if (totalMinutes < 5) return `cerca de ${totalMinutes} minutos`;
  return `aproximadamente ${totalMinutes} minutos`;
}

/**
 * Upload de áudio para transcrição via Deepgram
 * Fluxo STREAMING: Cliente → Edge Function (proxy) → Deepgram
 * Sem Storage intermediário - streaming direto
 */
export async function uploadAudioToTranscribe(
  file: File,
  userId: string,
  palestraId: string,
  onProgress?: (progress: number) => void
): Promise<{ success: boolean; message?: string }> {
  
  console.log(`📤 Processando ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);
  
  // Validar tamanho máximo
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`Arquivo muito grande. Tamanho máximo: 500MB. Para arquivos maiores, entre em contato com o suporte.`);
  }
  
  console.log('📦 Fazendo upload ao Storage...');
  if (onProgress) onProgress(20);
  
  // 1. Upload do áudio para o Storage
  const fileName = `${userId}/audios/${palestraId}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
  
  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('scribia-audio')
    .upload(fileName, file, {
      contentType: file.type,
      upsert: true,
    });

  if (uploadError) {
    console.error('❌ Erro no upload:', uploadError);
    throw new Error(`Erro no upload: ${uploadError.message}`);
  }

  console.log('✅ Upload concluído:', fileName);
  if (onProgress) onProgress(50);

  // 2. Gerar URL assinada (válida por 24h) para o Deepgram acessar
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('scribia-audio')
    .createSignedUrl(fileName, 86400); // 24 horas em segundos

  if (signedUrlError || !signedUrlData?.signedUrl) {
    console.error('❌ Erro ao gerar signed URL:', signedUrlError);
    throw new Error(`Erro ao gerar URL autenticada: ${signedUrlError?.message || 'URL inválida'}`);
  }

  console.log('🔗 URL autenticada gerada (válida por 24h)');
  if (onProgress) onProgress(60);

  // 3. Chamar edge function com URL (não arquivo)
  console.log('🎙️ Iniciando transcrição via Deepgram (URL remota)...');

  const { data: result, error: invokeError } = await supabase.functions.invoke<{
    success?: boolean;
    message?: string;
    transcription_url?: string;
  }>('scribia-transcribe', {
    body: {
      audio_url: signedUrlData.signedUrl,
      palestra_id: palestraId,
      user_id: userId,
    },
  });

  if (invokeError) {
    console.error('❌ Erro na transcrição:', invokeError);
    throw new Error(`Erro na transcrição: ${invokeError.message || 'Falha ao iniciar transcrição'}`);
  }

  if (onProgress) onProgress(100);
  console.log('✅ Transcrição iniciada com sucesso');

  return {
    success: true,
    message: result?.message || 'Transcrição em andamento',
  };
}
