import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlusCircle, Pencil, Trash2, Eye, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Palestra } from "@/types/palestra";
import { EditPalestraDialog } from "@/components/palestras/EditPalestraDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const PalestrasList = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [palestras, setPalestras] = useState<Palestra[]>([]);
  const [livebookStatuses, setLivebookStatuses] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [palestraToDelete, setPalestraToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [palestraToEdit, setPalestraToEdit] = useState<Palestra | null>(null);
  const [nomeEvento, setNomeEvento] = useState("");

  useEffect(() => {
    if (eventoId && user) {
      fetchEvento();
      fetchPalestras();
    }
  }, [eventoId, user]);

  const fetchEvento = async () => {
    try {
      const userId = localStorage.getItem('scribia_user_id');
      if (!userId) return;

      const { data, error } = await supabase.rpc('scribia_get_eventos' as any, {
        p_usuario_id: userId
      });

      if (error) throw error;
      
      if ((data as any)?.success) {
        const eventos = (data as any).eventos;
        const evento = eventos.find((e: any) => e.id === eventoId);
        setNomeEvento(evento?.nome || '');
      }
    } catch (error: any) {
      console.error("Erro ao buscar evento:", error);
    }
  };

  const fetchPalestras = async () => {
    try {
      setLoading(true);
      const userId = localStorage.getItem('scribia_user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.rpc('scribia_get_palestras' as any, {
        p_usuario_id: userId,
        p_evento_id: eventoId,
      });

      if (error) throw error;
      
      if ((data as any)?.success) {
        const palestrasData = (data as any).palestras || [];
        setPalestras(palestrasData);
        
        // Buscar status dos livebooks para cada palestra
        await fetchLivebookStatuses(palestrasData, userId);
      } else {
        throw new Error((data as any)?.error || 'Erro ao carregar palestras');
      }
    } catch (error: any) {
      toast({
        title: "Erro ao carregar palestras",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchLivebookStatuses = async (palestrasData: Palestra[], userId: string) => {
    try {
      const { data, error } = await supabase.rpc('scribia_get_livebooks' as any, {
        p_usuario_id: userId,
        p_evento_id: eventoId,
      });

      if (error) throw error;
      
      if ((data as any)?.success) {
        const livebooks = (data as any).livebooks || [];
        const statusMap: Record<string, string> = {};
        
        livebooks.forEach((lb: any) => {
          if (lb.palestra?.id) {
            statusMap[lb.palestra.id] = lb.status;
          }
        });
        
        setLivebookStatuses(statusMap);
      }
    } catch (error) {
      console.error('Erro ao buscar status dos livebooks:', error);
    }
  };

  const handleEditClick = (palestra: Palestra) => {
    setPalestraToEdit(palestra);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (id: string) => {
    setPalestraToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!palestraToDelete) return;

    try {
      const userId = localStorage.getItem('scribia_user_id');
      if (!userId) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.rpc('scribia_delete_palestra' as any, {
        p_palestra_id: palestraToDelete,
        p_usuario_id: userId,
      });

      if (error) throw error;
      
      if (!(data as any)?.success) {
        throw new Error((data as any)?.error || 'Erro ao excluir palestra');
      }

      toast({
        title: "🗑️ Palestra excluída com sucesso!",
      });

      fetchPalestras();
    } catch (error: any) {
      toast({
        title: "Erro ao excluir palestra",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setDeleteDialogOpen(false);
      setPalestraToDelete(null);
    }
  };

  const getStatusBadge = (status: Palestra['status']) => {
    const variants: Record<Palestra['status'], { label: string; variant: "default" | "secondary" | "destructive" | "outline" | "success" }> = {
      aguardando: { label: "Aguardando", variant: "outline" },
      processando: { label: "Processando", variant: "secondary" },
      concluido: { label: "Concluído", variant: "success" },
      erro: { label: "Erro", variant: "destructive" },
    };
    const config = variants[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getCustomizacaoText = (nivel: string | null, formato: string | null) => {
    if (!nivel && !formato) return null;
    
    const nivelLabels: Record<string, string> = {
      junior: "Júnior",
      pleno: "Pleno",
      senior: "Sênior",
    };
    
    const formatoLabels: Record<string, string> = {
      completo: "Completo",
      compacto: "Compacto",
    };
    
    const nivelText = nivel ? nivelLabels[nivel] || nivel : '';
    const formatoText = formato ? formatoLabels[formato] || formato : '';
    
    return [nivelText, formatoText].filter(Boolean).join(' ');
  };

  return (
    <div className="p-4 sm:p-6 py-6 space-y-6 w-full">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard/eventos")}
            className="w-fit"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar para Eventos
          </Button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Palestras - {nomeEvento}
              </h2>
              <p className="text-muted-foreground mt-1">
                Gerencie as palestras deste evento
              </p>
            </div>
            <Button
              onClick={() => navigate(`/dashboard/eventos/${eventoId}/palestras/nova`)}
              size="lg"
            >
              <PlusCircle className="mr-2 h-5 w-5" />
              Nova Palestra
            </Button>
          </div>
        </div>

        {/* Lista de Palestras */}
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-6 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mt-2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : palestras.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">
                Nenhuma palestra cadastrada ainda.
              </p>
              <Button onClick={() => navigate(`/dashboard/eventos/${eventoId}/palestras/nova`)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Criar Primeira Palestra
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {palestras.map((palestra) => (
              <Card key={palestra.id} className="hover:shadow-lg transition-shadow flex flex-col h-full min-h-[420px]">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg line-clamp-2">{palestra.titulo}</CardTitle>
                      {palestra.palestrante && (
                        <CardDescription className="mt-1 line-clamp-1">
                          {palestra.palestrante}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col flex-1 gap-4">
                  <div className="space-y-3 flex-1">
                    {/* Status Badge */}
                    <div className="flex items-center justify-start">
                      {getStatusBadge(palestra.status)}
                    </div>

                    {/* Customização */}
                    {getCustomizacaoText(palestra.nivel_escolhido, palestra.formato_escolhido) && (
                      <div className="text-sm text-muted-foreground line-clamp-2">
                        {getCustomizacaoText(palestra.nivel_escolhido, palestra.formato_escolhido)}
                      </div>
                    )}

                    {palestra.tags_tema && palestra.tags_tema.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {palestra.tags_tema.slice(0, 3).map((tag, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {palestra.tags_tema.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{palestra.tags_tema.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Data de criação */}
                    <div className="text-xs text-muted-foreground pt-2">
                      Criada em {new Date(palestra.criado_em).toLocaleDateString('pt-BR')} às{' '}
                      {new Date(palestra.criado_em).toLocaleTimeString('pt-BR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                  </div>

                  <div className="border-t pt-3" />

                  {/* Botões fixos no final */}
                  <div className="flex gap-2 w-full">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => navigate(`/dashboard/eventos/${eventoId}/palestras/${palestra.id}`)}
                      title="Ver detalhes"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditClick(palestra)}
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClick(palestra.id)}
                      title="Excluir"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        {palestraToEdit && (
          <EditPalestraDialog
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            palestra={palestraToEdit}
            onSuccess={fetchPalestras}
            livebookStatus={livebookStatuses[palestraToEdit.id] || null}
          />
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A palestra será permanentemente excluída.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PalestrasList;
