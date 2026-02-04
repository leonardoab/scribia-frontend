export type NivelConhecimento = 'junior' | 'pleno' | 'senior';
export type FormatoPalestra = 'completo' | 'compacto';
export type OrigemClassificacao = 'auto' | 'manual';
export type StatusPalestra = 'planejada' | 'em_andamento' | 'concluida' | 'cancelada';

export interface Palestra {
  id: string;
  evento_id: string | null; // Agora pode ser NULL para livebooks gerais
  usuario_id: string;
  titulo: string;
  palestrante: string | null;
  tags_tema: string[] | null;
  nivel_escolhido: NivelConhecimento | null;
  formato_escolhido: FormatoPalestra | null;
  origem_classificacao: OrigemClassificacao;
  confidence: number | null;
  webhook_destino: string | null;
  status: StatusPalestra;
  audio_urls?: string[] | null;
  audio_url: string | null;
  slides_url: string | null;
  transcricao_url: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface PalestraFormData {
  titulo: string;
  palestrante: string;
  tags_tema: string[];
  nivel_escolhido: NivelConhecimento | null;
  formato_escolhido: FormatoPalestra | null;
  origem_classificacao: OrigemClassificacao;
}

export interface PersonalizacaoResponse {
  nivel_sugerido: NivelConhecimento;
  confidence: number;
  justificativa?: string;
}

export const WEBHOOK_URLS = {
  personalizacao: 'https://sabrinaseibert.app.n8n.cloud/webhook/scribia_personalizacao',
  livebooks: {
    junior_completo: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_junior_completo',
    junior_compacto: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_junior_compacto',
    pleno_completo: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_pleno_completo',
    pleno_compacto: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_pleno_compacto',
    senio_completo: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_senio_completo',
    senio_compacto: 'https://sabrinaseibert.app.n8n.cloud/webhook/livebook_senio_compacto',
  }
};

export function getWebhookDestino(nivel: NivelConhecimento, formato: FormatoPalestra): string {
  const key = `${nivel}_${formato}` as keyof typeof WEBHOOK_URLS.livebooks;
  return WEBHOOK_URLS.livebooks[key];
}
