import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Users, 
  FileText, 
  BookOpen, 
  Download, 
  TrendingUp,
  Brain,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { dashboardApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const OrganizadorDashboard = () => {
  const { user } = useCustomAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  useEffect(() => {
    if (user) {
      fetchDashboard();
    }
  }, [user]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await dashboardApi.getInicio('organizador_evento');
      setDashboardData(response.data.data || response.data);
    } catch (error: any) {
      console.error('Erro ao carregar dashboard:', error);
      toast({
        title: 'Erro ao carregar dashboard',
        description: error.response?.data?.message || 'Não foi possível carregar os dados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Não foi possível carregar os dados do dashboard</p>
      </div>
    );
  }

  const stats = [
    { 
      title: 'Eventos Ativos', 
      value: String(dashboardData.estatisticas?.eventos_ativos || 0),
      icon: Calendar, 
      change: `${dashboardData.estatisticas?.total_eventos || 0} total`,
      color: 'from-purple-500 to-purple-600'
    },
    { 
      title: 'Participantes Inscritos', 
      value: String(dashboardData.estatisticas?.total_participantes || 0),
      icon: Users, 
      change: 'Total de participantes',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      title: 'Palestras Confirmadas', 
      value: String(dashboardData.estatisticas?.total_palestras || 0),
      icon: FileText, 
      change: 'Total de palestras',
      color: 'from-indigo-500 to-indigo-600'
    },
    { 
      title: 'Livebooks Disponíveis', 
      value: String(dashboardData.estatisticas?.total_livebooks || 0),
      icon: BookOpen, 
      change: `${dashboardData.estatisticas?.livebooks_concluidos || 0} concluídos`,
      color: 'from-violet-500 to-violet-600'
    },
    { 
      title: 'Downloads Realizados', 
      value: String(dashboardData.estatisticas?.total_downloads || 0),
      icon: Download, 
      change: 'Total de downloads',
      color: 'from-cyan-500 to-cyan-600'
    },
    { 
      title: 'Taxa de Engajamento', 
      value: (() => {
        const downloads = dashboardData.estatisticas?.total_downloads || 0;
        const participantes = dashboardData.estatisticas?.total_participantes || 0;
        if (participantes === 0) return '0%';
        const taxa = Math.round((downloads / participantes) * 100);
        return `${Math.min(taxa, 100)}%`;
      })(),
      icon: TrendingUp, 
      change: 'Downloads por participante',
      color: 'from-emerald-500 to-emerald-600'
    }
  ];

  const recentEvents = dashboardData.eventos_recentes || [];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              Dashboard do Organizador 🏥
            </h1>
            <p className="text-purple-100 text-lg">
              Bem-vindo, {dashboardData.usuario?.nome || user?.profile?.nome_completo}
            </p>
            <p className="text-purple-200 text-sm mt-2">
              Acompanhe o progresso do seu evento e o engajamento dos participantes
            </p>
          </div>
          <div className="hidden lg:block">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
              <Brain className="h-12 w-12 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold">{stat.value}</p>
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">{stat.change}</p>
                  </div>
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Events */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Eventos Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {recentEvents.length > 0 ? (
            <div className="space-y-4">
              {recentEvents.map((event: any) => (
                <div key={event.id} className="flex items-center justify-between p-4 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 border border-purple-100 dark:border-purple-900">
                  <div className="flex-1">
                    <h3 className="font-semibold text-lg">{event.nome_evento}</h3>
                    <p className="text-sm text-muted-foreground">
                      {new Date(event.data_inicio).toLocaleDateString('pt-BR')} - {event.cidade}, {event.estado}
                    </p>
                  </div>
                  <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">
                    {new Date(event.data_fim) >= new Date() ? 'Ativo' : 'Finalizado'}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum evento recente</p>
          )}
        </CardContent>
      </Card>

      {/* Popular Livebooks */}
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Livebooks Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          {dashboardData.livebooks_recentes && dashboardData.livebooks_recentes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.livebooks_recentes.map((livebook: any) => (
                <div key={livebook.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                  <div className="flex-1">
                    <h3 className="font-semibold">{livebook.palestra?.titulo || 'Sem título'}</h3>
                    <p className="text-sm text-muted-foreground">
                      {livebook.palestra?.palestrante || 'Palestrante não informado'}
                    </p>
                  </div>
                  <Badge variant={livebook.status === 'concluido' ? 'default' : 'secondary'}>
                    {livebook.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">Nenhum livebook recente</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrganizadorDashboard;
