import { supabase } from '@/integrations/supabase/client';

const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const SUPABASE_URL = "https://apnfbdkerddhkkzqstmp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFwbmZiZGtlcmRkaGtrenFzdG1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ0ODg2NTUsImV4cCI6MjA3MDA2NDY1NX0.CVcB4Rr8KD0xE-70DcLH4ezuyPuscoulIrQpt2lY3D4";

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
  
  const response = await fetch(
    `${SUPABASE_URL}/functions/v1/scribia-transcribe`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        audio_url: signedUrlData.signedUrl,
        palestra_id: palestraId,
        user_id: userId,
      }),
    }
  );
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Erro desconhecido' }));
    const errorMessage = errorData?.error || errorData?.message || `HTTP ${response.status}`;
    console.error('❌ Erro na transcrição:', response.status, errorMessage, errorData);
    throw new Error(`Erro na transcrição: ${errorMessage}`);
  }
  
  const result = await response.json();
  
  if (onProgress) onProgress(100);
  console.log('✅ Transcrição iniciada com sucesso');
  
  return { 
    success: true, 
    message: result.message || 'Transcrição em andamento' 
  };
}
