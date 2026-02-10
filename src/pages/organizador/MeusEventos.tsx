import React, { useState, useEffect } from 'react';
import { 
  Calendar, MapPin, Users, BookOpen, Plus, Eye, Edit, Trash2, Filter, Search, Play, Clock, CheckCircle, Mic, Loader2, Link2, Copy
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { eventosApi } from '@/services/api';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface Evento {
  id: string;
  nome_evento: string;
  data_inicio: string;
  data_fim: string;
  formato_evento: string;
  cidade: string;
  estado: string;
  pais: string;
  status: string;
  participantes: number;
  livebooks: number;
  palestras: number;
}

const MeusEventos = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('todos');
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchEventos();
    }
  }, [user]);

  const fetchEventos = async () => {
    try {
      setLoading(true);
      const response = await eventosApi.list();
      const eventosData = response.data?.data?.eventos || response.data?.eventos || response.data || [];

      const eventosComStatus = (Array.isArray(eventosData) ? eventosData : []).map((evento: any) => {
        const now = new Date();
        const dataInicio = new Date(evento.data_inicio);
        const dataFim = new Date(evento.data_fim);
        
        let status = 'Agendado';
        if (now >= dataInicio && now <= dataFim) {
          status = 'Em andamento';
        } else if (now > dataFim) {
          status = 'Concluído';
        }
        
        return {
          id: evento.id,
          nome_evento: evento.nome_evento,
          data_inicio: evento.data_inicio,
          data_fim: evento.data_fim,
          formato_evento: evento.formato_evento || 'remoto',
          cidade: evento.cidade || '',
          estado: evento.estado || '',
          pais: evento.pais || 'Brasil',
          status,
          participantes: evento.participantes_unicos || 0,
          livebooks: evento.total_livebooks || 0,
          palestras: evento.total_palestras || 0,
        };
      });

      setEventos(eventosComStatus);
    } catch (error: any) {
      console.error('Erro ao buscar eventos:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: error.response?.data?.message || 'Não foi possível carregar os eventos',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredEventos = eventos.filter(evento => {
    const local = `${evento.cidade}, ${evento.estado}, ${evento.pais}`;
    const matchesSearch = evento.nome_evento.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         local.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'todos' || evento.status.toLowerCase() === statusFilter.toLowerCase();
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: eventos.length,
    ativos: eventos.filter(e => e.status === 'Em andamento').length,
    agendados: eventos.filter(e => e.status === 'Agendado').length,
    concluidos: eventos.filter(e => e.status === 'Concluído').length
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Agendado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Concluído':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Em andamento':
        return '🟢';
      case 'Agendado':
        return '🔵';
      case 'Concluído':
        return '⚪';
      default:
        return '⚪';
    }
  };

  const formatPeriodo = (dataInicio: string, dataFim: string) => {
    const inicio = new Date(dataInicio).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    const fim = new Date(dataFim).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    return dataInicio === dataFim ? inicio : `${inicio} - ${fim}`;
  };

  const copiarLinkConvite = async (eventoId: string) => {
    try {
      const response = await eventosApi.gerarLink(eventoId);
      const link = response.data.data?.link || response.data.link;
      await navigator.clipboard.writeText(link);
      toast({
        title: 'Link copiado!',
        description: 'O link de convite foi copiado para a área de transferência',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao gerar link',
        description: error.response?.data?.message || 'Não foi possível gerar o link',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando eventos...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
              <Calendar className="h-8 w-8" />
              Meus Eventos
            </h1>
            <p className="text-purple-100 text-lg">
              Gerencie todos os seus eventos e acompanhe o desempenho
            </p>
          </div>
          <Button 
            onClick={() => navigate('/organizador/criar-evento')}
            className="bg-white text-purple-600 hover:bg-purple-50 font-semibold px-6 py-3"
          >
            <Plus className="h-5 w-5 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total de Eventos</p>
                <p className="text-3xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Calendar className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Em Andamento</p>
                <p className="text-3xl font-bold text-green-600">{stats.ativos}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
                <Play className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Agendados</p>
                <p className="text-3xl font-bold text-blue-600">{stats.agendados}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Clock className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Concluídos</p>
                <p className="text-3xl font-bold text-gray-600">{stats.concluidos}</p>
              </div>
              <div className="w-12 h-12 bg-gradient-to-br from-gray-500 to-gray-600 rounded-xl flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-0 shadow-lg">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar eventos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'todos' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('todos')}
                className={statusFilter === 'todos' ? 'bg-purple-600 hover:bg-purple-700' : 'border-purple-200 text-purple-700 hover:bg-purple-50'}
              >
                Todos
              </Button>
              <Button
                variant={statusFilter === 'em andamento' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('em andamento')}
                className={statusFilter === 'em andamento' ? 'bg-green-600 hover:bg-green-700' : 'border-green-200 text-green-700 hover:bg-green-50'}
              >
                Em Andamento
              </Button>
              <Button
                variant={statusFilter === 'agendado' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('agendado')}
                className={statusFilter === 'agendado' ? 'bg-blue-600 hover:bg-blue-700' : 'border-blue-200 text-blue-700 hover:bg-blue-50'}
              >
                Agendados
              </Button>
              <Button
                variant={statusFilter === 'concluído' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('concluído')}
                className={statusFilter === 'concluído' ? 'bg-gray-600 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}
              >
                Concluídos
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredEventos.length === 0 ? (
          <Card className="col-span-full border-0 shadow-lg">
            <CardContent className="p-12 text-center">
              <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">Nenhum evento encontrado</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || statusFilter !== 'todos' 
                  ? 'Tente ajustar os filtros de busca'
                  : 'Comece criando seu primeiro evento'}
              </p>
              {!searchTerm && statusFilter === 'todos' && (
                <Button 
                  onClick={() => navigate('/organizador/criar-evento')}
                  className="bg-purple-600 hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Evento
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredEventos.map((evento) => (
            <Card key={evento.id} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{evento.nome_evento}</CardTitle>
                    <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>{formatPeriodo(evento.data_inicio, evento.data_fim)}</span>
                      </div>
                      {(evento.formato_evento === 'presencial' || evento.formato_evento === 'hibrido') && evento.cidade && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>{evento.cidade}, {evento.estado}, {evento.pais}</span>
                        </div>
                      )}
                      {evento.formato_evento === 'remoto' && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4" />
                          <span>Evento Remoto</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <Badge className={getStatusColor(evento.status)}>
                    {getStatusIcon(evento.status)} {evento.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-blue-600">{evento.participantes}</p>
                    <p className="text-xs text-gray-600">Participantes</p>
                  </div>
                  <div className="text-center p-3 bg-purple-50 rounded-lg">
                    <BookOpen className="h-5 w-5 text-purple-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-purple-600">{evento.livebooks}</p>
                    <p className="text-xs text-gray-600">Livebooks</p>
                  </div>
                  <div 
                    className="text-center p-3 bg-indigo-50 rounded-lg cursor-pointer hover:bg-indigo-100 transition-colors"
                    onClick={() => navigate(`/organizador/eventos/${evento.id}/palestras`)}
                  >
                    <Mic className="h-5 w-5 text-indigo-600 mx-auto mb-1" />
                    <p className="text-2xl font-bold text-indigo-600">{evento.palestras}</p>
                    <p className="text-xs text-gray-600">Palestras</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 border-purple-200 text-purple-700 hover:bg-purple-50"
                    onClick={() => navigate(`/organizador/dashboard/${evento.id}`)}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    Ver Detalhes
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-green-200 text-green-700 hover:bg-green-50"
                    onClick={() => copiarLinkConvite(evento.id)}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar Link
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-blue-200 text-blue-700 hover:bg-blue-50"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="border-red-200 text-red-700 hover:bg-red-50"
                    onClick={async () => {
                      if (confirm('Tem certeza que deseja excluir este evento?')) {
                        try {
                          await eventosApi.delete(evento.id);
                          toast({
                            title: 'Evento excluído',
                            description: 'O evento foi excluído com sucesso',
                          });
                          fetchEventos();
                        } catch (error: any) {
                          toast({
                            title: 'Erro ao excluir evento',
                            description: error.response?.data?.message || 'Não foi possível excluir o evento',
                            variant: 'destructive',
                          });
                        }
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default MeusEventos;
