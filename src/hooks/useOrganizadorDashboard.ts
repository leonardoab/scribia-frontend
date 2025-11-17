import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from './useCustomAuth';

export interface DashboardMetrics {
  totalPalestras: number;
  totalAudios: number;
  livebooksGerados: number;
  percentualConclusao: number;
  totalParticipantes: number;
  participantesAtivos: number;
  totalDownloads: number;
  totalVisualizacoes: number;
  totalVendas: number;
  receitaTotal: number;
  receitaOrganizador: number;
  vendasPorOrigem: { origem: string; quantidade: number }[];
  palestrantesMaisAcessados: {
    palestrante: string;
    downloads: number;
    visualizacoes: number;
  }[];
  patrocinadoresEngajamento: {
    nome: string;
    impressoes: number;
    cliques: number;
    taxa: number;
  }[];
}

export const useOrganizadorDashboard = (eventoId: string) => {
  const { user } = useCustomAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventoId || !user) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);

        const { count: totalPalestras } = await supabase
          .from('scribia_palestras')
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', eventoId);

        const { data: palestrasData } = await supabase
          .from('scribia_palestras')
          .select('audio_url, status')
          .eq('evento_id', eventoId);

        const totalAudios = palestrasData?.filter(p => p.audio_url).length || 0;
        const livebooksGerados = palestrasData?.filter(p => p.status === 'concluido').length || 0;
        const percentualConclusao = totalPalestras ? Math.round((livebooksGerados / totalPalestras) * 100) : 0;

        const { count: totalParticipantes } = await supabase
          .from('scribia_participantes_evento' as any)
          .select('*', { count: 'exact', head: true })
          .eq('evento_id', eventoId);

        const { data: acessosData } = await supabase
          .from('scribia_acessos_livebooks' as any)
          .select('tipo_acesso, participante_id')
          .eq('evento_id', eventoId);

        const participantesAtivos = new Set(acessosData?.map((a: any) => a.participante_id)).size;
        const totalDownloads = acessosData?.filter((a: any) => a.tipo_acesso === 'download').length || 0;
        const totalVisualizacoes = acessosData?.filter((a: any) => a.tipo_acesso === 'visualizacao').length || 0;

        const { data: vendasData } = await supabase
          .from('scribia_vendas_premium' as any)
          .select('valor_total, comissao_organizador, origem_venda')
          .eq('evento_id', eventoId);

        const totalVendas = vendasData?.length || 0;
        const receitaTotal = vendasData?.reduce((sum: number, v: any) => sum + Number(v.valor_total), 0) || 0;
        const receitaOrganizador = vendasData?.reduce((sum: number, v: any) => sum + Number(v.comissao_organizador || 0), 0) || 0;

        const vendasPorOrigemMap = new Map<string, number>();
        vendasData?.forEach((v: any) => {
          const origem = v.origem_venda || 'Não especificado';
          vendasPorOrigemMap.set(origem, (vendasPorOrigemMap.get(origem) || 0) + 1);
        });
        const vendasPorOrigem = Array.from(vendasPorOrigemMap.entries()).map(([origem, quantidade]) => ({
          origem,
          quantidade
        }));

        const { data: palestrantesData } = await supabase
          .from('scribia_palestras')
          .select('palestrante, id')
          .eq('evento_id', eventoId);

        const palestranteStats = new Map();
        for (const palestra of palestrantesData || []) {
          const { data: acessos } = await supabase
            .from('scribia_acessos_livebooks' as any)
            .select('tipo_acesso')
            .eq('palestra_id', palestra.id);

          const downloads = acessos?.filter((a: any) => a.tipo_acesso === 'download').length || 0;
          const visualizacoes = acessos?.filter((a: any) => a.tipo_acesso === 'visualizacao').length || 0;

          if (!palestranteStats.has(palestra.palestrante)) {
            palestranteStats.set(palestra.palestrante, { downloads: 0, visualizacoes: 0 });
          }
          const stats = palestranteStats.get(palestra.palestrante);
          stats.downloads += downloads;
          stats.visualizacoes += visualizacoes;
        }

        const palestrantesMaisAcessados = Array.from(palestranteStats.entries())
          .map(([palestrante, stats]) => ({
            palestrante,
            downloads: stats.downloads,
            visualizacoes: stats.visualizacoes
          }))
          .sort((a, b) => (b.downloads + b.visualizacoes) - (a.downloads + a.visualizacoes))
          .slice(0, 5);

        const { data: patrocinadoresData } = await supabase
          .from('scribia_patrocinadores_engajamento' as any)
          .select('*')
          .eq('evento_id', eventoId);

        const patrocinadoresEngajamento = patrocinadoresData?.map((p: any) => ({
          nome: p.patrocinador_nome,
          impressoes: p.impressoes,
          cliques: p.cliques,
          taxa: p.impressoes > 0 ? Number(((p.cliques / p.impressoes) * 100).toFixed(2)) : 0
        })) || [];

        setMetrics({
          totalPalestras: totalPalestras || 0,
          totalAudios,
          livebooksGerados,
          percentualConclusao,
          totalParticipantes: totalParticipantes || 0,
          participantesAtivos,
          totalDownloads,
          totalVisualizacoes,
          totalVendas,
          receitaTotal,
          receitaOrganizador,
          vendasPorOrigem,
          palestrantesMaisAcessados,
          patrocinadoresEngajamento
        });

      } catch (err: any) {
        console.error('Erro ao buscar métricas:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [eventoId, user]);

  return { metrics, loading, error };
};
