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

  // 3. Mock de transcrição (simulação)
  console.log('🎙️ Simulando transcrição...');
  console.log('📋 Palestra ID recebido:', palestraId);
  console.log('👤 User ID:', userId);
  
  // Simular delay de processamento
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Criar palestra nova (o palestraId recebido é apenas um UUID temporário)
  let realPalestraId = palestraId;
  try {
    console.log('🎬 Criando palestra...');
    const createPalestraResponse = await fetch(`${getApiBaseUrl()}/palestras`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        titulo: 'Livebook via Upload',
        palestrante: 'Não informado',
        status: 'planejada',
      }),
    });
    
    if (createPalestraResponse.ok) {
      const palestraData = await createPalestraResponse.json();
      realPalestraId = palestraData.data?.id || palestraData.id;
      console.log('✅ Palestra criada:', realPalestraId);
    } else {
      console.error('❌ Erro ao criar palestra');
      throw new Error('Erro ao criar palestra');
    }
  } catch (error) {
    console.error('❌ Erro ao criar palestra:', error);
    throw error;
  }
  
  // Criar livebook mockado via API com URLs de documentos
  try {
    const response = await fetch(`${getApiBaseUrl()}/livebooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
      },
      body: JSON.stringify({
        palestra_id: realPalestraId,
        tipo_resumo: 'completo',
        status: 'concluido',
      }),
    });
    
    if (!response.ok) {
      throw new Error('Erro ao criar livebook');
    }
    
    const result = await response.json();
    const livebookId = result.data?.id || result.id;
    
    // Atualizar livebook com URLs mockadas
    if (livebookId) {
      await fetch(`${getApiBaseUrl()}/livebooks/${livebookId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          pdf_url: `https://example.com/livebooks/${livebookId}.pdf`,
          docx_url: `https://example.com/livebooks/${livebookId}.docx`,
          html_url: `https://example.com/livebooks/${livebookId}.html`,
        }),
      });
    }
    
    console.log('✅ Livebook criado com sucesso (mock)');
  } catch (error) {
    console.error('❌ Erro ao criar livebook:', error);
    throw error;
  }

  if (onProgress) onProgress(100);
  console.log('✅ Transcrição iniciada com sucesso');

  return {
    success: true,
    message: 'Transcrição concluída (mock)',
  };
}
