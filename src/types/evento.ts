export interface Evento {
  id: string;
  usuario_id: string;
  nome_evento: string;
  data_inicio: string | null;
  data_fim: string | null;
  formato_evento: string | null;
  cidade: string | null;
  estado: string | null;
  pais: string | null;
  observacoes: string | null;
  criado_em: string;
  atualizado_em: string;
}

export interface EventoFormData {
  nome_evento: string;
  data_inicio: string;
  data_fim: string;
  formato_evento?: string;
  cidade: string;
  estado: string;
  pais: string;
  observacoes: string;
}
