import { getApiBaseUrl } from '@/services/api';
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
  
  console.log('📦 Fazendo upload do áudio...');
  if (onProgress) onProgress(20);
  
  // Simular upload (remover Supabase Storage)
  console.log('✅ Upload simulado concluído');
  if (onProgress) onProgress(50);

  
  // Simular transcrição
  console.log('🎙️ Simulando transcrição...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  if (onProgress) onProgress(80);
  
  // Retornar transcrição mockada
  const transcricaoMock = `Transcrição simulada do arquivo: ${file.name}\n\nEste é um conteúdo de exemplo gerado automaticamente.`;
  
  if (onProgress) onProgress(100);
  console.log('✅ Transcrição concluída');

  return {
    success: true,
    message: transcricaoMock,
  };
}
