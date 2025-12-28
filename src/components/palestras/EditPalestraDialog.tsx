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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palestra, NivelConhecimento, FormatoPalestra, getWebhookDestino } from "@/types/palestra";
import { AudioUploader } from "@/components/audio/AudioUploader";

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
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    titulo: palestra.titulo,
    palestrante: palestra.palestrante || "",
    tags_tema: palestra.tags_tema || [],
    nivel_escolhido: palestra.nivel_escolhido,
    formato_escolhido: palestra.formato_escolhido,
  });
  const [currentTag, setCurrentTag] = useState("");
  const [showAudioUpload, setShowAudioUpload] = useState(false);
  const [audioUploaded, setAudioUploaded] = useState(false);

  // Determinar permissões de edição baseadas no status
  const canEditBasicInfo = palestra.status === 'aguardando' || palestra.status === 'erro' || livebookStatus === 'concluido';
  const canEditNivelFormato = palestra.status === 'aguardando' || palestra.status === 'erro';
  const canReuploadAudio = palestra.status === 'aguardando' || palestra.status === 'erro';
  const isProcessing = palestra.status === 'processando';

  // Resetar form quando palestra mudar
  useEffect(() => {
    setFormData({
      titulo: palestra.titulo,
      palestrante: palestra.palestrante || "",
      tags_tema: palestra.tags_tema || [],
      nivel_escolhido: palestra.nivel_escolhido,
      formato_escolhido: palestra.formato_escolhido,
    });
    setCurrentTag("");
    setShowAudioUpload(false);
    setAudioUploaded(false);
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

  const handleAudioUploadComplete = async (transcricao: string) => {
    setAudioUploaded(true);
    setShowAudioUpload(false);
    toast.success("Áudio carregado! O livebook será gerado automaticamente.");
    onSuccess();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!formData.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    // Se vai fazer reprocessamento, valida nível e formato
    if (canEditNivelFormato && showAudioUpload) {
      if (!formData.nivel_escolhido) {
        toast.error("Selecione o nível de conhecimento");
        return;
      }
      if (!formData.formato_escolhido) {
        toast.error("Selecione o formato");
        return;
      }
    }

    try {
      setLoading(true);
      
      const userId = localStorage.getItem('scribia_user_id');
      if (!userId) {
        toast.error("Usuário não autenticado");
        return;
      }

      // Calcular webhook se tiver nível e formato
      let webhookDestino = palestra.webhook_destino;
      if (formData.nivel_escolhido && formData.formato_escolhido) {
        webhookDestino = getWebhookDestino(formData.nivel_escolhido, formData.formato_escolhido);
      }

      const { data, error } = await supabase.rpc('scribia_update_palestra', {
        p_palestra_id: palestra.id,
        p_usuario_id: userId,
        p_titulo: formData.titulo.trim(),
        p_palestrante: formData.palestrante.trim() || null,
        p_tags_tema: formData.tags_tema.length > 0 ? formData.tags_tema : null,
        p_nivel_escolhido: formData.nivel_escolhido,
        p_formato_escolhido: formData.formato_escolhido,
        p_webhook_destino: webhookDestino,
      });

      if (error) throw error;

      const result = data as { success: boolean; error?: string };

      if (!result.success) {
        throw new Error(result.error || 'Erro ao atualizar palestra');
      }

      toast.success("Palestra atualizada com sucesso!");
      onSuccess();
      
      // Só fecha se não estiver no modo de upload de áudio
      if (!showAudioUpload) {
        onOpenChange(false);
      }
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

          {/* Nível e Formato */}
          {canEditNivelFormato && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Personalização do Livebook</h3>
              
              <div className="space-y-3">
                <Label>Nível de Conhecimento</Label>
                <RadioGroup
                  value={formData.nivel_escolhido || ""}
                  onValueChange={(value) => setFormData({ ...formData, nivel_escolhido: value as NivelConhecimento })}
                  disabled={loading}
                  className="grid grid-cols-3 gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="junior" id="junior" />
                    <Label htmlFor="junior" className="cursor-pointer">Júnior</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pleno" id="pleno" />
                    <Label htmlFor="pleno" className="cursor-pointer">Pleno</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="senior" id="senior" />
                    <Label htmlFor="senior" className="cursor-pointer">Sênior</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Formato</Label>
                <RadioGroup
                  value={formData.formato_escolhido || ""}
                  onValueChange={(value) => setFormData({ ...formData, formato_escolhido: value as FormatoPalestra })}
                  disabled={loading}
                  className="grid grid-cols-2 gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="completo" id="completo" />
                    <Label htmlFor="completo" className="cursor-pointer">Completo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="compacto" id="compacto" />
                    <Label htmlFor="compacto" className="cursor-pointer">Compacto</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Status atual do nível/formato se não editável */}
          {!canEditNivelFormato && (palestra.nivel_escolhido || palestra.formato_escolhido) && (
            <div className="space-y-2 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Personalização (não editável)</h3>
              <div className="flex gap-2">
                {palestra.nivel_escolhido && (
                  <Badge variant="secondary">
                    {palestra.nivel_escolhido === 'junior' ? 'Júnior' : 
                     palestra.nivel_escolhido === 'pleno' ? 'Pleno' : 'Sênior'}
                  </Badge>
                )}
                {palestra.formato_escolhido && (
                  <Badge variant="outline">
                    {palestra.formato_escolhido === 'completo' ? 'Completo' : 'Compacto'}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Re-upload de Áudio */}
          {canReuploadAudio && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-muted-foreground">Upload de Áudio</h3>
                {!showAudioUpload && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAudioUpload(true)}
                    disabled={loading}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {palestra.audio_url ? 'Substituir Áudio' : 'Adicionar Áudio'}
                  </Button>
                )}
              </div>
              
              {palestra.audio_url && !showAudioUpload && (
                <p className="text-sm text-muted-foreground">
                  Áudio já carregado. Clique em "Substituir Áudio" para enviar um novo.
                </p>
              )}

              {showAudioUpload && (
                <div className="space-y-3">
                  {!formData.nivel_escolhido || !formData.formato_escolhido ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Selecione o nível e formato acima antes de fazer upload do áudio.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <AudioUploader
                        palestraId={palestra.id}
                        onUploadComplete={handleAudioUploadComplete}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowAudioUpload(false)}
                      >
                        Cancelar upload
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
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
