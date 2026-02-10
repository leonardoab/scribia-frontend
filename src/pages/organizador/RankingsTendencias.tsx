import React, { useState, useEffect } from 'react';
import { Trophy, Brain, TrendingUp, BarChart3, Loader2, Eye, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { palestrasApi } from '@/services/api';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface Palestra {
  id: string;
  titulo: string;
  palestrante: string;
  evento_nome: string;
  total_acessos: number;
  livebooks_gerados: number;
}

const RankingsTendencias = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [palestras, setPalestras] = useState<Palestra[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchPalestras();
    }
  }, [user]);

  const fetchPalestras = async () => {
    try {
      setLoading(true);
      const response = await palestrasApi.list();
      const palestrasData = response.data?.data || response.data || [];
      
      // Ordenar por total de acessos
      const sorted = [...palestrasData].sort((a, b) => (b.total_acessos || 0) - (a.total_acessos || 0));
      setPalestras(sorted);
    } catch (error: any) {
      console.error('Erro ao buscar palestras:', error);
      toast({
        title: 'Erro ao carregar rankings',
        description: error.response?.data?.message || 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const topPalestras = palestras.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Rankings e Tendências</h1>
          <p className="text-muted-foreground">Inteligência de engajamento e interesse do público</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Top Palestras por Acessos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Carregando...</span>
              </div>
            ) : topPalestras.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4">
                Nenhuma palestra com acessos registrados ainda.
              </p>
            ) : (
              <div className="space-y-3">
                {topPalestras.map((palestra, index) => (
                  <div key={palestra.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                        index === 0 ? 'bg-yellow-500' : 
                        index === 1 ? 'bg-gray-400' : 
                        index === 2 ? 'bg-orange-500' : 
                        'bg-blue-500'
                      }`}>
                        {index + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{palestra.titulo}</h4>
                      <p className="text-sm text-gray-600 truncate">
                        {palestra.palestrante} • {palestra.evento_nome}
                      </p>
                    </div>
                    <div className="flex gap-4 text-right">
                      <div>
                        <div className="flex items-center gap-1 text-purple-600">
                          <Eye className="h-4 w-4" />
                          <span className="font-bold">{palestra.total_acessos || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500">Acessos</p>
                      </div>
                      <div>
                        <div className="flex items-center gap-1 text-blue-600">
                          <Download className="h-4 w-4" />
                          <span className="font-bold">{palestra.livebooks_gerados || 0}</span>
                        </div>
                        <p className="text-xs text-gray-500">Livebooks</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Temas em Alta
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">Em Breve</Badge>
              <p className="text-sm text-muted-foreground">
                Análise dos temas mais procurados pelos participantes.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BarChart3 className="h-5 w-5 text-blue-600" />
                Insights da IA
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant="secondary" className="mb-2">Em Breve</Badge>
              <p className="text-sm text-muted-foreground">
                Recomendações inteligentes baseadas no comportamento dos participantes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default RankingsTendencias;
