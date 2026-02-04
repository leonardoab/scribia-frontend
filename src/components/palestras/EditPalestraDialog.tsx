import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { X, Upload, Loader2, AlertCircle, Info } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { Palestra } from "@/types/palestra";
import { useCustomAuth } from "@/hooks/useCustomAuth";

interface EditPalestraDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  palestra: Palestra;
  onSuccess: () => void;
  livebookStatus?: string | null;
}

export function EditPalestraDialog({
  open, 
  onOpenChange, 
  palestra, 
  onSuccess,
  livebookStatus 
}: EditPalestraDialogProps) {
  const { user } = useCustomAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: palestra.titulo,
    palestrante: palestra.palestrante || "",
    data_hora_inicio: palestra.data_hora_inicio || "",
    informacoes_adicionais: palestra.informacoes_adicionais || "",
    tags_tema: palestra.tags_tema || [],
  });
  const [currentTag, setCurrentTag] = useState("");

  // Determinar permissões de edição baseadas no status
  const canEditBasicInfo = palestra.status === 'planejada' || palestra.status === 'cancelada';
  const isProcessing = palestra.status === 'em_andamento';

  // Resetar form quando palestra mudar
  useEffect(() => {
    setFormData({
      titulo: palestra.titulo,
      palestrante: palestra.palestrante || "",
      data_hora_inicio: palestra.data_hora_inicio ? palestra.data_hora_inicio.split('T')[0] + 'T' + palestra.data_hora_inicio.split('T')[1].substring(0,5) : "",
      informacoes_adicionais: palestra.informacoes_adicionais || "",
      tags_tema: palestra.tags_tema || [],
    });
    setCurrentTag("");
  }, [palestra]);

  const handleAddTag = () => {
    if (currentTag.trim() && !formData.tags_tema.includes(currentTag.trim())) {
      setFormData({
        ...formData,
        tags_tema: [...formData.tags_tema, currentTag.trim()],
      });
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags_tema: formData.tags_tema.filter((t) => t !== tag),
    });
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    try {
      setLoading(true);
      
      if (!user?.profile?.id) {
        toast.error("Usuário não autenticado");
        return;
      }

      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/v1/palestras/${palestra.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          titulo: formData.titulo.trim(),
          palestrante: formData.palestrante.trim() || null,
          data_hora_inicio: formData.data_hora_inicio || null,
          informacoes_adicionais: formData.informacoes_adicionais || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao atualizar palestra');
      }

      toast.success("Palestra atualizada com sucesso!");
      onSuccess();
      onOpenChange(false);
    } catch (error: any) {
      console.error('Erro ao atualizar palestra:', error);
      toast.error(error.message || "Erro ao atualizar palestra");
    } finally {
      setLoading(false);
    }
  };

  const getStatusInfo = () => {
    if (isProcessing) {
      return {
        type: 'warning' as const,
        message: 'Esta palestra está sendo processada. Aguarde a conclusão para fazer alterações.'
      };
    }
    if (palestra.status === 'concluido' && livebookStatus !== 'concluido') {
      return {
        type: 'info' as const,
        message: 'O livebook está sendo gerado. Você poderá editar após a conclusão.'
      };
    }
    if (livebookStatus === 'concluido') {
      return {
        type: 'info' as const,
        message: 'Livebook concluído. Você pode editar as informações básicas, mas não é possível alterar o áudio.'
      };
    }
    if (palestra.status === 'erro') {
      return {
        type: 'warning' as const,
        message: 'Houve um erro no processamento. Você pode corrigir as informações e tentar novamente.'
      };
    }
    return null;
  };

  const statusInfo = getStatusInfo();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Palestra</DialogTitle>
          <DialogDescription>
            Altere as informações da palestra
          </DialogDescription>
        </DialogHeader>

        {statusInfo && (
          <Alert variant={statusInfo.type === 'warning' ? 'destructive' : 'default'}>
            {statusInfo.type === 'warning' ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Info className="h-4 w-4" />
            )}
            <AlertDescription>{statusInfo.message}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-6 py-4">
          {/* Informações Básicas */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
            
            <div className="space-y-2">
              <Label htmlFor="titulo">
                Título <span className="text-destructive">*</span>
              </Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Digite o título da palestra"
                maxLength={200}
                disabled={!canEditBasicInfo || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="palestrante">Palestrante</Label>
              <Input
                id="palestrante"
                value={formData.palestrante}
                onChange={(e) => setFormData({ ...formData, palestrante: e.target.value })}
                placeholder="Nome do palestrante (opcional)"
                maxLength={100}
                disabled={!canEditBasicInfo || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="data_hora_inicio">Data e Hora de Início</Label>
              <Input
                id="data_hora_inicio"
                type="datetime-local"
                value={formData.data_hora_inicio}
                onChange={(e) => setFormData({ ...formData, data_hora_inicio: e.target.value })}
                disabled={!canEditBasicInfo || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="informacoes_adicionais">Informações Adicionais</Label>
              <Input
                id="informacoes_adicionais"
                value={formData.informacoes_adicionais}
                onChange={(e) => setFormData({ ...formData, informacoes_adicionais: e.target.value })}
                placeholder="Detalhes sobre a palestra"
                disabled={!canEditBasicInfo || loading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tag">Tags/Temas</Label>
              <div className="flex gap-2">
                <Input
                  id="tag"
                  value={currentTag}
                  onChange={(e) => setCurrentTag(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddTag();
                    }
                  }}
                  placeholder="Digite uma tag e pressione Enter"
                  disabled={!canEditBasicInfo || loading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddTag}
                  disabled={!canEditBasicInfo || loading}
                >
                  Adicionar
                </Button>
              </div>

              {formData.tags_tema.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags_tema.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      {canEditBasicInfo && (
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 hover:text-destructive"
                          disabled={loading}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Fim dos campos básicos */}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || isProcessing || (!canEditBasicInfo && !canEditNivelFormato)}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar alterações"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
