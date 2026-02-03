import React, { useState, useEffect } from 'react';
import { Calendar, BookOpen, Clock, Brain, TrendingUp, Users, FileText, Award, Mic, CheckCircle, Upload, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { dashboardApi } from '@/services/api';
import { useNavigate } from 'react-router-dom';
import { QuickLivebookModal } from '@/components/dashboard/QuickLivebookModal';
import { LivebookProgress } from '@/components/dashboard/LivebookProgress';
import { useToast } from '@/hooks/use-toast';

// Helper para formatar perfil de aprendizado
const getPerfilLabel = (nivel?: string | null, formato?: string | null) => {
  if (!nivel || !formato) return null;
  
  const nivelMap: Record<string, string> = {
    junior: 'Júnior',
    pleno: 'Pleno',
    senior: 'Sênior'
  };
  
  const formatoMap: Record<string, string> = {
    compacto: 'Compacto',
    completo: 'Completo'
  };
  
  return `${nivelMap[nivel]} ${formatoMap[formato]}`;
};

// Helper para descrição do perfil
const getPerfilDescription = (nivel?: string | null, formato?: string | null) => {
  if (!nivel || !formato) return 'Defina seu perfil para receber conteúdos personalizados';
  
  const descMap: Record<string, string> = {
    'junior-compacto': 'Profissional iniciante - conteúdo educativo essencial e claro',
    'junior-completo': 'Profissional iniciante - conteúdo educativo detalhado',
    'pleno-compacto': 'Profissional experiente com foco em aplicabilidade direta',
    'pleno-completo': 'Profissional experiente - equilíbrio entre teoria e prática',
    'senior-compacto': 'Líder/Especialista - síntese estratégica densa',
    'senior-completo': 'Visão estratégica - análise crítica aprofundada'
  };
  
  return descMap[`${nivel}-${formato}`] || 'Perfil personalizado';
};

const Dashboard = () => {
  const { user: customUser } = useCustomAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isQuickModalOpen, setIsQuickModalOpen] = useState(false);
  const [progressModalOpen, setProgressModalOpen] = useState(false);
  const [monitoringPalestraId, setMonitoringPalestraId] = useState<string | null>(null);
  const [completedLivebookId, setCompletedLivebookId] = useState<string | null>(null);
  const [isLivebookComplete, setIsLivebookComplete] = useState(false);
  
  const [stats, setStats] = useState({
    totalEventos: 0,
    totalPalestras: 0,
    totalLivebooks: 0,
    livebooksConcluidos: 0,
    eventos_recentes: [] as any[],
    livebooks_recentes: [] as any[]
  });

  useEffect(() => {
    if (!customUser?.profile?.id) {
      console.log('⚠️ Dashboard: Aguardando autenticação...');
      return;
    }

    const userId = customUser.profile.id;
    console.log('✅ Dashboard: Usuário autenticado:', userId);

    const fetchStats = async () => {
      try {
        console.log('📊 Dashboard: Buscando estatísticas via API...');
        
        const response = await dashboardApi.getInicio();
        const statsData = response.data;

        console.log('✅ Dashboard: Estatísticas carregadas:', statsData);
        
        setStats({
          totalEventos: statsData.total_eventos || 0,
          totalPalestras: statsData.total_palestras || 0,
          totalLivebooks: statsData.total_livebooks || 0,
          livebooksConcluidos: statsData.livebooks_concluidos || 0,
          eventos_recentes: statsData.eventos_recentes || [],
          livebooks_recentes: statsData.livebooks_recentes || []
        });
      } catch (error: any) {
        console.error('❌ Dashboard: Erro ao buscar estatísticas:', error);
        toast({
          title: "Erro ao carregar estatísticas",
          description: error.response?.data?.message || "Não foi possível carregar os dados do dashboard.",
          variant: "destructive"
        });
      }
    };
    
    fetchStats();

    // Polling para atualizar dados a cada 30 segundos
    const interval = setInterval(fetchStats, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [customUser, toast]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const handlePalestraCreated = (palestraId: string) => {
    setMonitoringPalestraId(palestraId);
    setIsLivebookComplete(false); // Reset do status de conclusão
    setProgressModalOpen(true);
    setIsQuickModalOpen(false);
  };

  const handleLivebookComplete = (livebookId: string) => {
    setCompletedLivebookId(livebookId);
    setIsLivebookComplete(true); // Marcar como concluído
    setMonitoringPalestraId(null); // Limpar o ID para remover o botão "Ver Progresso"
    setProgressModalOpen(false); // Fechar o modal de progresso
    
    // Atualizar stats
    const fetchStats = async () => {
      if (!customUser?.profile?.id) return;
      
      const userId = customUser.profile.id;
      
      try {
        // Recarregar todas as stats via RPC
        const { data, error } = await supabase.rpc('scribia_get_dashboard_stats', {
          p_user_id: userId
        });

        if (error) throw error;
        
        const statsData = data as any;
        setStats({
          totalEventos: statsData.total_eventos || 0,
          totalPalestras: statsData.total_palestras || 0,
          totalLivebooks: statsData.total_livebooks || 0,
          livebooksConcluidos: statsData.livebooks_concluidos || 0,
          eventos_recentes: statsData.eventos_recentes || [],
          livebooks_recentes: statsData.livebooks_recentes || []
        });
      } catch (error) {
        console.error('Erro ao atualizar estatísticas:', error);
      }
    };
    
    fetchStats();
  };

  return (
    <div className="p-4 sm:p-6 py-6 space-y-6">
      {/* Saudação personalizada */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">
          {getGreeting()}, {customUser?.profile?.nome_completo || 'Usuário'}! 👋
        </h1>
        <p className="text-purple-100">
          Bem-vindo ao seu painel ScribIA Plus. Aqui você pode acompanhar seus eventos, 
          Livebooks e interagir com nossos agentes inteligentes.
        </p>
      </div>

      {/* Ação Rápida - Gravar/Upload */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 relative">
        <CardContent className="p-8">
          {/* Badge de notificação */}
          {monitoringPalestraId && !isLivebookComplete && (
            <Badge className="absolute top-4 right-4 bg-blue-500 hover:bg-blue-600">
              <Loader2 className="w-3 h-3 mr-1 animate-spin" />
              Processando
            </Badge>
          )}
          
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                <Mic className="w-8 h-8 text-white" />
              </div>
            </div>
            <h3 className="text-2xl font-bold">Comece Agora Mesmo</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Grave sua palestra ao vivo ou faça upload do arquivo de áudio para gerar o resumo instantaneamente
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                onClick={() => setIsQuickModalOpen(true)}
              >
                <Mic className="mr-2 h-5 w-5" />
                Gravar Agora
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => setIsQuickModalOpen(true)}
              >
                <Upload className="mr-2 h-5 w-5" />
                Upload de Arquivo
              </Button>
              {monitoringPalestraId && !isLivebookComplete && (
                <Button 
                  variant="secondary" 
                  size="lg"
                  onClick={() => setProgressModalOpen(true)}
                >
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Ver Progresso
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Eventos</p>
                <p className="text-2xl font-bold">{stats.totalEventos}</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Palestras</p>
                <p className="text-2xl font-bold">{stats.totalPalestras}</p>
              </div>
              <Mic className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Livebooks</p>
                <p className="text-2xl font-bold">{stats.totalLivebooks}</p>
              </div>
              <BookOpen className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Concluídos</p>
                <p className="text-2xl font-bold">{stats.livebooksConcluidos}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-teal-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Atividades Recentes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eventos Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-purple-600" />
              Eventos Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[160px]">
              {stats.eventos_recentes.length > 0 ? (
                <div className="space-y-4">
                  {stats.eventos_recentes.map((evento) => (
                    <div key={evento.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">{evento.nome_evento}</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(evento.data_inicio)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum evento cadastrado ainda</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/eventos')}>
              Ver todos os eventos
            </Button>
          </CardContent>
        </Card>

        {/* Livebooks Recentes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              Livebooks Recentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="min-h-[160px]">
              {stats.livebooks_recentes.length > 0 ? (
                <div className="space-y-4">
                  {stats.livebooks_recentes.map((livebook) => (
                    <div key={livebook.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div>
                        <h4 className="font-medium text-foreground">{livebook.palestra?.titulo || 'Sem título'}</h4>
                        <p className="text-sm text-muted-foreground">{formatDate(livebook.criado_em)}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={livebook.tipo_resumo === 'completo' ? 'bg-green-50 text-green-700' : 'bg-blue-50 text-blue-700'}
                      >
                        {livebook.tipo_resumo === 'completo' ? 'Completo' : 'Compacto'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Nenhum livebook gerado ainda</p>
              )}
            </div>
            <Button variant="outline" className="w-full" onClick={() => navigate('/dashboard/livebooks')}>
              Ver todos os Livebooks
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Seção de Perfil de Aprendizado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-600" />
            Seu Perfil de Aprendizado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customUser?.profile?.perfil_definido ? (
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 p-4 rounded-lg border border-yellow-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {getPerfilLabel(customUser.profile.nivel_preferido, customUser.profile.formato_preferido)}
                  </h3>
                  <p className="text-gray-700 mb-3">
                    {getPerfilDescription(customUser.profile.nivel_preferido, customUser.profile.formato_preferido)}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <span>✓ Nível: {customUser.profile.nivel_preferido}</span>
                    <span>✓ Formato: {customUser.profile.formato_preferido}</span>
                  </div>
                </div>
                <a href="/definir-perfil">
                  <Button variant="outline" size="sm" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Redefinir Perfil
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Defina seu Perfil de Aprendizado
                  </h3>
                  <p className="text-gray-700 mb-3">
                    Personalize seus Livebooks de acordo com seu nível de conhecimento e preferências.
                  </p>
                </div>
                <a href="/definir-perfil">
                  <Button size="sm" className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Definir Perfil
                  </Button>
                </a>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cards de Agentes IA */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bia - Análise de Perfil */}
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center">
                  <Brain className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-purple-900">Bia - Análise de Perfil</h3>
              </div>
              <p className="text-gray-700">
                Converse com a Bia para reavaliar seu perfil de aprendizado e personalizar ainda mais seus Livebooks.
              </p>
              <Button 
                className="w-full bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/dashboard/bia')}
              >
                <Brain className="mr-2 h-5 w-5" />
                Conversar com Bia
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Tutor ScribIA */}
        <Card className="bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-blue-900">Tutor ScribIA</h3>
              </div>
              <p className="text-gray-700">
                Tire dúvidas sobre seus Livebooks e receba explicações personalizadas baseadas no seu conteúdo.
              </p>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700"
                onClick={() => navigate('/dashboard/tutor')}
              >
                <FileText className="mr-2 h-5 w-5" />
                Conversar com Tutor
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dicas e Sugestões */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <TrendingUp className="h-5 w-5" />
            Dicas para Aproveitar Melhor o ScribIA Plus
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Cadastre Eventos</h4>
              <p className="text-sm text-gray-600">
                Organize seus eventos para gerar Livebooks mais contextualizados
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <Brain className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Use a Lia</h4>
              <p className="text-sm text-gray-600">
                Reavalie seu perfil regularmente para conteúdos mais personalizados
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full p-3 w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                <FileText className="h-6 w-6 text-green-600" />
              </div>
              <h4 className="font-medium text-gray-900 mb-1">Explore Formatos</h4>
              <p className="text-sm text-gray-600">
                Baixe seus Livebooks em PDF ou DOCX conforme sua necessidade
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Modal de Criação Rápida */}
      <QuickLivebookModal 
        open={isQuickModalOpen}
        onOpenChange={setIsQuickModalOpen}
        onPalestraCreated={handlePalestraCreated}
      />

      {/* Modal de Progresso do Livebook */}
      <Dialog open={progressModalOpen} onOpenChange={setProgressModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>📚 Gerando seu Livebook</DialogTitle>
          </DialogHeader>
          {monitoringPalestraId && customUser?.profile?.id && (
            <LivebookProgress 
              palestraId={monitoringPalestraId}
              userId={customUser.profile.id}
              onComplete={handleLivebookComplete}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;