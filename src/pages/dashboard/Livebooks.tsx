import { getApiBaseUrl } from '@/services/api';
import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Filter, Download, Eye, Trash2, Calendar, FileText, Loader2, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { livebooksApi } from '@/services/api';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Livebook {
  id: string;
  titulo: string;
  data_criacao: string;
  evento_relacionado?: string;
  tipo_resumo: 'completo' | 'compacto';
  nivel_perfil: 'junior' | 'pleno' | 'senior';
  formatos: {
    pdf: boolean;
    docx: boolean;
  };
  status: 'processando' | 'concluido' | 'erro';
}

const Livebooks = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useCustomAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'todos' | 'com-evento' | 'sem-evento'>('todos');
  const [livebooks, setLivebooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [livebookToDelete, setLivebookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLivebooks = async () => {
      try {
        setLoading(true);
        
        const response = await livebooksApi.list();
        const backendData = response.data.data || response.data;
        const livebooksData = backendData.livebooks || [];
        
        console.log('Livebooks recebidos:', livebooksData);
        setLivebooks(Array.isArray(livebooksData) ? livebooksData : []);
      } catch (err: any) {
        console.error('Erro ao buscar livebooks:', err);
        setError(err.response?.data?.message || err.message);
        setLivebooks([]);
        toast({
          title: "Erro ao carregar livebooks",
          description: err.response?.data?.message || err.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchLivebooks();

    // Polling para atualizar dados a cada 30 segundos
    const interval = setInterval(fetchLivebooks, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [user, authLoading, toast]);

  const filteredLivebooks = livebooks.filter(livebook => {
    const titulo = livebook.palestra?.titulo || '';
    const eventoNome = livebook.palestra?.evento?.nome_evento || '';
    const matchesSearch = titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         eventoNome.toLowerCase().includes(searchTerm.toLowerCase());
    
    const hasEvento = !!livebook.palestra?.evento;
    const matchesFilter = filterType === 'todos' ||
                         (filterType === 'com-evento' && hasEvento) ||
                         (filterType === 'sem-evento' && !hasEvento);
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      aguardando: { label: 'Aguardando', variant: 'secondary' as const },
      transcrevendo: { label: 'Transcrevendo', variant: 'default' as const },
      processando: { label: 'Processando', variant: 'default' as const },
      concluido: { label: 'Concluído', variant: 'default' as const },
      erro: { label: 'Erro', variant: 'destructive' as const }
    };
    return badges[status as keyof typeof badges] || badges.aguardando;
  };

  const getTipoResumo = (tipo: string) => {
    return tipo === 'completo' ? 'Completo' : 'Compacto';
  };

  const getNivelPerfil = (nivel: string) => {
    const niveis = {
      junior: 'Júnior',
      pleno: 'Pleno',
      senior: 'Sênior'
    };
    return niveis[nivel as keyof typeof niveis] || nivel;
  };

  const handleView = (livebookId: string) => {
    navigate(`/dashboard/livebooks/${livebookId}`);
  };

  const handleDownloadPdf = async (livebook: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/livebooks/${livebook.id}/download/pdf`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Livebook_${livebook.palestra?.titulo || 'ScribIA'}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download iniciado",
        description: "O arquivo está sendo baixado",
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleDownloadTxt = async (livebook: any) => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/livebooks/${livebook.id}/download/txt`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao baixar arquivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Livebook_${livebook.palestra?.titulo || 'ScribIA'}_completo.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Download iniciado",
        description: "O arquivo TXT está sendo baixado",
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast({
        title: "Erro no download",
        description: "Não foi possível baixar o arquivo",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (livebookId: string) => {
    if (!user) return;

    try {
      const { data, error } = await supabase.rpc('scribia_cancel_livebook', {
        p_livebook_id: livebookId,
        p_usuario_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao cancelar livebook');
      }

      toast({
        title: "Livebook cancelado",
        description: "A geração foi cancelada com sucesso",
      });

      // Atualizar lista
      setLivebooks(prev => prev.map(lb => 
        lb.id === livebookId 
          ? { ...lb, status: 'erro', erro_log: 'Cancelado pelo usuário' }
          : lb
      ));
    } catch (error: any) {
      console.error('Erro ao cancelar livebook:', error);
      toast({
        title: "Erro ao cancelar",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = (livebookId: string) => {
    setLivebookToDelete(livebookId);
  };

  const confirmDelete = async () => {
    if (!user || !livebookToDelete) return;

    try {
      setIsDeleting(true);
      
      const { data, error } = await supabase.rpc('scribia_delete_livebook', {
        p_livebook_id: livebookToDelete,
        p_usuario_id: user.id
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result?.success) {
        throw new Error(result?.error || 'Erro ao excluir livebook');
      }

      toast({
        title: "Livebook excluído",
        description: "O livebook foi removido com sucesso",
      });

      // Remover da lista local
      setLivebooks(prev => prev.filter(lb => lb.id !== livebookToDelete));
      
      setLivebookToDelete(null);
    } catch (error: any) {
      console.error('Erro ao excluir livebook:', error);
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDelete = () => {
    setLivebookToDelete(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <span className="ml-2 text-muted-foreground">Carregando livebooks...</span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Faça login para ver seus livebooks.</p>
      </div>
    );
  }

  if (livebooks.length === 0 && !searchTerm) {
    return (
      <div className="text-center py-12">
        <BookOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">
          Nenhum Livebook ainda
        </h3>
        <p className="text-muted-foreground mb-6">
          Crie seu primeiro Livebook agora mesmo!
        </p>
        <Button onClick={() => navigate('/dashboard/gerar-livebook')} size="lg">
          <BookOpen className="h-5 w-5 mr-2" />
          Criar Livebook
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Meus Livebooks</h1>
          <p className="text-muted-foreground mt-1">Todos os seus materiais de estudo personalizados</p>
        </div>
        <Button onClick={() => navigate('/dashboard/gerar-livebook')} size="lg">
          <BookOpen className="h-5 w-5 mr-2" />
          Criar Livebook
        </Button>
      </div>

      {/* Filtros e Busca */}
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Busca */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Buscar por título, evento, data..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Filtros */}
        <div className="flex gap-2">
          <Button
            variant={filterType === 'todos' ? 'default' : 'outline'}
            onClick={() => setFilterType('todos')}
            size="sm"
          >
            Todos
          </Button>
          <Button
            variant={filterType === 'com-evento' ? 'default' : 'outline'}
            onClick={() => setFilterType('com-evento')}
            size="sm"
          >
            Com evento
          </Button>
          <Button
            variant={filterType === 'sem-evento' ? 'default' : 'outline'}
            onClick={() => setFilterType('sem-evento')}
            size="sm"
          >
            Sem evento
          </Button>
        </div>
      </div>

      {/* Lista de Livebooks */}
      <div className="space-y-4">
        {filteredLivebooks.map((livebook) => (
          <Card key={livebook.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <BookOpen className="h-5 w-5 text-primary mt-1" />
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold mb-2">
                          {livebook.titulo || livebook.palestra?.titulo || 'Sem título'}
                        </h3>
                        
                        {livebook.palestra?.palestrante && (
                          <p className="text-sm text-muted-foreground mb-2">
                            Por: {livebook.palestra.palestrante}
                          </p>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                          <div>
                            <span className="text-sm text-muted-foreground">Data:</span>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3 text-muted-foreground" />
                              <span className="text-sm font-medium">
                                {formatDate(livebook.criado_em)}
                              </span>
                            </div>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Evento:</span>
                            <p className="text-sm font-medium">
                              {livebook.palestra?.evento?.nome_evento || 'Sem vínculo'}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Tipo:</span>
                            <p className="text-sm font-medium">
                              {getTipoResumo(livebook.tipo_resumo)}
                            </p>
                          </div>

                          <div>
                            <span className="text-sm text-muted-foreground">Status:</span>
                            <Badge variant={getStatusBadge(livebook.status).variant}>
                              {getStatusBadge(livebook.status).label}
                            </Badge>
                          </div>
                        </div>

                {/* Formatos disponíveis */}
                        {(livebook.pdf_url || livebook.docx_url) && (
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-sm text-muted-foreground">Formatos disponíveis:</span>
                            {livebook.pdf_url && (
                              <Badge variant="outline" className="text-xs bg-red-50 text-red-600 border-red-200">PDF</Badge>
                            )}
                            {livebook.docx_url && (
                              <Badge variant="outline" className="text-xs bg-blue-50 text-blue-600 border-blue-200">TXT</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                {/* Ações */}
                <div className="flex flex-col gap-2 ml-4">
                  {livebook.status === 'processando' && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleCancel(livebook.id)}
                    >
                      <XCircle className="h-3 w-3 mr-1" />
                      Cancelar
                    </Button>
                  )}

                  {livebook.status === 'concluido' && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadPdf(livebook)}
                      >
                        <FileText className="h-3 w-3 mr-1" />
                        PDF
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadTxt(livebook)}
                      >
                        <Download className="h-3 w-3 mr-1" />
                        TXT
                      </Button>
                    </>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/dashboard/livebooks/${livebook.id}`)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Ver
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(livebook.id)}
                    className="text-destructive hover:text-destructive/90"
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Estado vazio */}
      {filteredLivebooks.length === 0 && (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Nenhum Livebook encontrado
            </h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm 
                ? `Nenhum resultado para "${searchTerm}"`
                : 'Você ainda não possui Livebooks gerados.'
              }
            </p>
            {searchTerm && (
              <Button 
                variant="outline"
                onClick={() => setSearchTerm('')}
              >
                Limpar busca
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* Estatísticas no rodapé */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-primary">{livebooks.length}</div>
              <div className="text-sm text-muted-foreground">Total de Livebooks</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-primary">
                {livebooks.filter(l => l.evento_relacionado).length}
              </div>
              <div className="text-sm text-muted-foreground">Com evento</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {livebooks.filter(l => l.status === 'concluido').length}
              </div>
              <div className="text-sm text-muted-foreground">Concluídos</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {livebooks.filter(l => l.status === 'processando').length}
              </div>
              <div className="text-sm text-muted-foreground">Processando</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Diálogo de confirmação de exclusão */}
      <AlertDialog open={!!livebookToDelete} onOpenChange={(open) => !open && cancelDelete()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este Livebook? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete} disabled={isDeleting}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Livebooks;