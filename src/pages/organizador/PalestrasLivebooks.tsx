import React, { useState, useEffect } from 'react';
import { 
  Presentation, 
  BookOpen, 
  Download, 
  Search,
  TrendingUp,
  Calendar,
  Eye,
  Trash2,
  Plus,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { livebooksApi, eventosApi, palestrasApi } from '@/services/api';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface Palestra {
  id: string;
  titulo: string;
  palestrante: string;
  evento_nome: string;
  livebooks_gerados: number;
  total_acessos: number;
  data_palestra: string;
  tags_tema: string[];
}

const PalestrasLivebooks = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventoFilter, setEventoFilter] = useState('todos');
  const [palestras, setPalestras] = useState<Palestra[]>([]);
  const [eventos, setEventos] = useState<Array<{ id: string; nome: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      setLoading(true);

      const [palestrasRes, eventosRes] = await Promise.all([
        palestrasApi.list(),
        eventosApi.list()
      ]);

      const palestrasData = palestrasRes.data?.data || palestrasRes.data || [];
      const eventosData = eventosRes.data?.data?.eventos || eventosRes.data?.eventos || eventosRes.data || [];

      setEventos(Array.isArray(eventosData) ? eventosData.map((e: any) => ({ id: e.id, nome: e.nome_evento })) : []);
      setPalestras(Array.isArray(palestrasData) ? palestrasData : []);
    } catch (error: any) {
      console.error('Erro ao buscar dados:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: error.response?.data?.message || 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredPalestras = palestras.filter(palestra => {
    const matchesSearch = palestra.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         palestra.palestrante.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvento = eventoFilter === 'todos' || palestra.evento_nome === eventoFilter;
    return matchesSearch && matchesEvento;
  });

  const totalPalestras = palestras.length;
  const totalLivebooks = palestras.reduce((sum, p) => sum + p.livebooks_gerados, 0);
  const mediaPorPalestra = totalPalestras > 0 ? Math.round(totalLivebooks / totalPalestras) : 0;

  const topPalestras = [...palestras]
    .sort((a, b) => (b.total_acessos || 0) - (a.total_acessos || 0))
    .slice(0, 3);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando palestras...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Palestras e Livebooks</h1>
          <p className="text-gray-600">Acompanhe o desempenho do conteúdo dos seus eventos</p>
        </div>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Palestras</CardTitle>
            <Presentation className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalPalestras}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Livebooks Gerados</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{totalLivebooks}</div>
            <p className="text-xs text-muted-foreground">
              Média de {mediaPorPalestra} por palestra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média por Palestra</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mediaPorPalestra}</div>
            <p className="text-xs text-muted-foreground">
              Livebooks por palestra
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Palestra Mais Popular</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{topPalestras[0]?.total_acessos || 0}</div>
            <p className="text-xs text-muted-foreground truncate">
              {topPalestras[0]?.titulo.substring(0, 30) || 'N/A'}...
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top 3 Palestras */}
      {topPalestras.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Top 3 Palestras Mais Acessadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topPalestras.map((palestra, index) => (
                <div key={palestra.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : 'bg-orange-500'
                    }`}>
                      {index + 1}
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{palestra.titulo}</h4>
                    <p className="text-sm text-gray-600">por {palestra.palestrante}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-purple-600">{palestra.total_acessos || 0}</div>
                    <p className="text-xs text-gray-500">Acessos</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por título ou palestrante..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={eventoFilter} onValueChange={setEventoFilter}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Filtrar por evento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Eventos</SelectItem>
                {eventos.map(evento => (
                  <SelectItem key={evento.id} value={evento.nome}>{evento.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Palestras */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Palestras ({filteredPalestras.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título da Palestra</TableHead>
                <TableHead>Palestrante</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Livebooks</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPalestras.map((palestra) => (
                <TableRow key={palestra.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{palestra.titulo}</p>
                      <div className="flex items-center gap-2 mt-1">
                        {palestra.tags_tema.length > 0 && (
                          <Badge variant="outline" className="text-xs">
                            {palestra.tags_tema[0]}
                          </Badge>
                        )}
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(palestra.data_palestra).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium">{palestra.palestrante}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{palestra.evento_nome}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-purple-500" />
                      <span className="font-bold text-purple-600">{palestra.livebooks_gerados}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {new Date(palestra.data_palestra).toLocaleDateString('pt-BR')}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredPalestras.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Presentation className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma palestra encontrada</h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de busca ou cadastre uma nova palestra.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PalestrasLivebooks;
