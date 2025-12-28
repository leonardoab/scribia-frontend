import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ArrowLeft, Edit2, Save, X, Download, Eye, FileText, Loader2, AlertTriangle, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { STATUS_LABELS, STATUS_COLORS, TIPO_RESUMO_LABELS } from '@/types/livebook';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Evento {
  id: string;
  nome_evento: string;
}

interface Livebook {
  id: string;
  tipo_resumo: string;
  status: string;
  pdf_url: string | null;
  docx_url: string | null;
  html_url: string | null;
  criado_em: string;
  tempo_processamento: number | null;
  erro_log: string | null;
  palestra: {
    id: string;
    titulo: string;
    palestrante: string | null;
    evento_id: string | null;
    evento: {
      id: string;
      nome_evento: string;
    } | null;
  };
}

export default function LivebookDetalhe() {
  const { livebookId } = useParams<{ livebookId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [livebook, setLivebook] = useState<Livebook | null>(null);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [showRemoveEventoDialog, setShowRemoveEventoDialog] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({
    titulo: '',
    palestrante: '',
    evento_id: '' as string | 'sem-evento'
  });

  useEffect(() => {
    if (user && livebookId) {
      fetchLivebook();
      fetchEventos();
    }
  }, [user, livebookId]);

  const fetchLivebook = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('scribia_get_livebooks', {
        p_usuario_id: user!.id,
        p_evento_id: null
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; livebooks: Livebook[] };
      const livebookData = result.livebooks.find(lb => lb.id === livebookId);

      if (!livebookData) {
        toast.error('Livebook não encontrado');
        navigate('/dashboard/livebooks');
        return;
      }

      setLivebook(livebookData);
      setFormData({
        titulo: livebookData.palestra.titulo,
        palestrante: livebookData.palestra.palestrante || '',
        evento_id: livebookData.palestra.evento_id || 'sem-evento'
      });
    } catch (error: any) {
      console.error('Erro ao buscar livebook:', error);
      toast.error('Erro ao carregar livebook');
    } finally {
      setLoading(false);
    }
  };

  const fetchEventos = async () => {
    try {
      const { data, error } = await supabase.rpc('scribia_get_eventos', {
        p_usuario_id: user!.id
      });

      if (error) throw error;

      const result = data as unknown as { success: boolean; eventos: Evento[] };
      setEventos(result.eventos || []);
    } catch (error: any) {
      console.error('Erro ao buscar eventos:', error);
    }
  };

  const handleSave = async () => {
    if (!livebook || !formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    if (formData.evento_id === 'sem-evento' && livebook.palestra.evento_id) {
      setShowRemoveEventoDialog(true);
      return;
    }

    await saveChanges();
  };

  const saveChanges = async () => {
    try {
      setSaving(true);

      const { data, error } = await supabase.rpc('scribia_update_palestra_from_livebook', {
        p_palestra_id: livebook!.palestra.id,
        p_usuario_id: user!.id,
        p_titulo: formData.titulo.trim(),
        p_palestrante: formData.palestrante.trim() || null,
        p_evento_id: formData.evento_id === 'sem-evento' ? null : formData.evento_id || null,
        p_remove_evento: formData.evento_id === 'sem-evento'
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Erro ao salvar alterações');
      }

      toast.success('Alterações salvas com sucesso');
      setEditMode(false);
      await fetchLivebook();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar alterações');
    } finally {
      setSaving(false);
      setShowRemoveEventoDialog(false);
    }
  };

  const handleFinalizarLivebook = async () => {
    if (!livebook) return;
    
    try {
      setFinalizing(true);
      
      const { data, error } = await supabase.rpc('scribia_finalizar_livebook' as any, {
        p_livebook_id: livebook.id,
        p_usuario_id: user!.id,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string; message?: string };

      if (!result.success) {
        throw new Error(result.error || 'Erro ao finalizar livebook');
      }

      toast.success(result.message || 'Livebook marcado como concluído!');
      await fetchLivebook();
    } catch (error: any) {
      console.error('Erro ao finalizar livebook:', error);
      toast.error(error.message || 'Erro ao finalizar livebook');
    } finally {
      setFinalizing(false);
    }
  };

  const handleCancel = () => {
    if (!livebook) return;
    setFormData({
      titulo: livebook.palestra.titulo,
      palestrante: livebook.palestra.palestrante || '',
      evento_id: livebook.palestra.evento_id || 'sem-evento'
    });
    setEditMode(false);
  };

  const handleDownload = async (url: string, filename: string) => {
    try {
      toast.info('Baixando arquivo...');
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      toast.success('Download concluído!');
    } catch (error) {
      console.error('Erro ao baixar arquivo:', error);
      toast.error('Erro ao baixar arquivo');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!livebook) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">Este livebook não foi encontrado.</p>
          <Button onClick={() => navigate('/dashboard/livebooks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{livebook.palestra.titulo}</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/dashboard/livebooks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          {!editMode ? (
            <Button onClick={() => setEditMode(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <>
              <Button variant="outline" onClick={handleCancel} disabled={saving}>
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Salvar
                  </>
                )}
              </Button>
            </>
          )}
        </div>
      </div>
      <div className="space-y-6">
        {/* Informações do Livebook */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Informações do Livebook</CardTitle>
              <Badge className={STATUS_COLORS[livebook.status as keyof typeof STATUS_COLORS]}>
                {STATUS_LABELS[livebook.status as keyof typeof STATUS_LABELS]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Tipo de Resumo</Label>
                <p className="font-medium">{TIPO_RESUMO_LABELS[livebook.tipo_resumo as keyof typeof TIPO_RESUMO_LABELS]}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Data de Criação</Label>
                <p className="font-medium">
                  {format(new Date(livebook.criado_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              </div>
              {livebook.tempo_processamento && (
                <div>
                  <Label className="text-muted-foreground">Tempo de Processamento</Label>
                  <p className="font-medium">{Math.round(livebook.tempo_processamento)} segundos</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Palestra Relacionada (Editável) */}
        <Card>
          <CardHeader>
            <CardTitle>Palestra Relacionada</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título da Palestra <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                disabled={!editMode}
                placeholder="Digite o título da palestra"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="palestrante">Palestrante</Label>
              <Input
                id="palestrante"
                value={formData.palestrante}
                onChange={(e) => setFormData({ ...formData, palestrante: e.target.value })}
                disabled={!editMode}
                placeholder="Nome do palestrante (opcional)"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="evento">Evento</Label>
              <Select
                value={formData.evento_id}
                onValueChange={(value) => setFormData({ ...formData, evento_id: value })}
                disabled={!editMode}
              >
                <SelectTrigger id="evento">
                  <SelectValue placeholder="Selecione um evento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sem-evento">Sem evento</SelectItem>
                  {eventos.map((evento) => (
                    <SelectItem key={evento.id} value={evento.id}>
                      {evento.nome_evento}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Erro */}
        {livebook.status === 'erro' && livebook.erro_log && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Erro no Processamento
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{livebook.erro_log}</p>
            </CardContent>
          </Card>
        )}

        {/* Arquivos Gerados */}
        {livebook.status === 'concluido' && (livebook.pdf_url || livebook.html_url || livebook.docx_url) && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Arquivos Gerados</CardTitle>
                <Badge className="bg-green-500 text-white">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Concluído
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {livebook.pdf_url && (
                  <Button
                    onClick={() => handleDownload(livebook.pdf_url!, `${livebook.palestra.titulo}.pdf`)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar PDF
                  </Button>
                )}
                {livebook.html_url && (
                  <Button variant="outline" asChild>
                    <a href={livebook.html_url} target="_blank" rel="noopener noreferrer">
                      <Eye className="h-4 w-4 mr-2" />
                      Ver Online
                    </a>
                  </Button>
                )}
                {livebook.docx_url && (
                  <Button
                    variant="outline"
                    onClick={() => handleDownload(livebook.docx_url!, `${livebook.palestra.titulo}.docx`)}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Baixar DOCX
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Botão para marcar como concluído (quando gerado mas não finalizado) */}
        {livebook.status !== 'concluido' && livebook.status !== 'erro' && (livebook.pdf_url || livebook.html_url || livebook.docx_url) && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Finalizar Edição
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Após revisar e editar o livebook, marque como concluído para finalizar o processo. 
                Isso travará alterações de nível e formato na palestra original.
              </p>
              <Button 
                onClick={handleFinalizarLivebook} 
                disabled={finalizing}
                className="w-full sm:w-auto"
              >
                {finalizing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Finalizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Marcar como Concluído
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de confirmação para remover evento */}
      <AlertDialog open={showRemoveEventoDialog} onOpenChange={setShowRemoveEventoDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover vínculo com evento?</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja remover o vínculo deste livebook com o evento "{livebook.palestra.evento?.nome_evento}"?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={saveChanges} disabled={saving}>
              {saving ? 'Removendo...' : 'Remover vínculo'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
