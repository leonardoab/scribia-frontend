import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Download, 
  Calendar,
  BookOpen,
  TrendingUp,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { participantesApi, eventosApi } from '@/services/api';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';

interface Participante {
  id: string;
  nome: string;
  email: string;
  evento: string;
  livebooks_gerados: number;
  ultima_atividade: string;
}

const Participantes = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [eventoFilter, setEventoFilter] = useState('todos');
  const [participantes, setParticipantes] = useState<Participante[]>([]);
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

      const [participantesRes, eventosRes] = await Promise.all([
        participantesApi.list(),
        eventosApi.list()
      ]);

      const participantesData = participantesRes.data?.data?.participantes || participantesRes.data?.participantes || [];
      const eventosData = eventosRes.data?.data?.eventos || eventosRes.data?.eventos || eventosRes.data || [];

      setEventos(Array.isArray(eventosData) ? eventosData.map((e: any) => ({ id: e.id, nome: e.nome_evento })) : []);
      setParticipantes(Array.isArray(participantesData) ? participantesData : []);
    } catch (error: any) {
      console.error('Erro ao buscar participantes:', error);
      toast({
        title: 'Erro ao carregar participantes',
        description: error.response?.data?.message || 'Não foi possível carregar os participantes',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredParticipantes = Array.isArray(participantes) ? participantes.filter(participante => {
    const matchesSearch = participante.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         participante.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesEvento = eventoFilter === 'todos' || participante.evento === eventoFilter;
    return matchesSearch && matchesEvento;
  }) : [];

  const totalParticipantes = participantes.length;
  const totalLivebooks = participantes.reduce((sum, p) => sum + p.livebooks_gerados, 0);
  const mediaLivebooks = totalParticipantes > 0 ? Math.round(totalLivebooks / totalParticipantes) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando participantes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Participantes</h1>
          <p className="text-gray-600">Gerencie e acompanhe os participantes dos seus eventos</p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar Lista
        </Button>
      </div>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Participantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{totalParticipantes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Média de Livebooks</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{mediaLivebooks}</div>
            <p className="text-xs text-muted-foreground">
              Por participante
            </p>
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
              Total de livebooks gerados
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Eventos Ativos</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {eventos.length}
            </div>
            <p className="text-xs text-muted-foreground">
              Total de eventos cadastrados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome ou email..."
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

      {/* Tabela de Participantes */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Participantes ({filteredParticipantes.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Evento</TableHead>
                <TableHead>Livebooks</TableHead>
                <TableHead>Última Atividade</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredParticipantes.map((participante) => (
                <TableRow key={participante.id}>
                  <TableCell>
                    <p className="font-medium">{participante.nome}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-muted-foreground">{participante.email}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm">{participante.evento}</p>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{participante.livebooks_gerados}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(participante.ultima_atividade).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filteredParticipantes.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum participante encontrado</h3>
            <p className="text-gray-600">
              Tente ajustar os filtros de busca ou aguarde novos cadastros.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Participantes;
