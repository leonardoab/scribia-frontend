import { getApiBaseUrl } from '@/services/api';
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Loader2, CheckCircle, Download, FileText, BookOpen } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { AudioUploader } from "@/components/audio/AudioUploader";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import {
  NivelConhecimento,
  FormatoPalestra,
  getWebhookDestino,
} from "@/types/palestra";

const PalestraForm = () => {
  const { eventoId } = useParams<{ eventoId: string }>();
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const { user } = useCustomAuth();

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

  const [formData, setFormData] = useState({
    titulo: "",
    palestrante: "",
    data_hora_inicio: "",
    informacoes_adicionais: "",
    tags_tema: [] as string[],
  });

  const [currentTag, setCurrentTag] = useState("");
  const [preparingUpload, setPreparingUpload] = useState(false);
  const [transcricao, setTranscricao] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [livebookData, setLivebookData] = useState<any>(null);
  const [livebookContent, setLivebookContent] = useState<string>('');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  // Helper functions para formatação
  const formatNivel = (nivel: string | null): string => {
    const niveis: Record<string, string> = {
      'junior': 'Júnior',
      'pleno': 'Pleno',
      'senior': 'Sênior'
    };
    return nivel ? niveis[nivel] || nivel : '-';
  };

  const formatFormato = (formato: string | null): string => {
    const formatos: Record<string, string> = {
      'completo': 'Completo',
      'compacto': 'Compacto'
    };
    return formato ? formatos[formato] || formato : '-';
  };

  const getNivelVariant = (nivel: string | null): "default" | "secondary" | "destructive" | "outline" => {
    if (nivel === 'junior') return 'secondary';
    if (nivel === 'pleno') return 'default';
    if (nivel === 'senior') return 'destructive';
    return 'outline';
  };

  const handleAddTag = () => {
    if (currentTag.trim()) {
      const newTags = currentTag
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0 && !formData.tags_tema.includes(tag));
      
      if (newTags.length > 0) {
        setFormData({
          ...formData,
          tags_tema: [...formData.tags_tema, ...newTags],
        });
      }
      setCurrentTag("");
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({
      ...formData,
      tags_tema: formData.tags_tema.filter((t) => t !== tag),
    });
  };

  const handleBasicInfoSubmit = async () => {
    if (!formData.titulo.trim()) {
      toastHook({
        title: "Campo obrigatório",
        description: "O título da palestra é obrigatório.",
        variant: "destructive",
      });
      return;
    }
    
    setPreparingUpload(true);
    const palestraIdNovo = await criarPalestra();
    setPreparingUpload(false);

    console.log('ID da palestra criada:', palestraIdNovo);

    if (palestraIdNovo) {
      toastHook({
        title: 'Palestra criada com sucesso! ✅',
        description: 'Redirecionando para a lista de palestras...'
      });
      
      setTimeout(() => {
        console.log('Navegando para:', `/organizador/eventos/${eventoId}/palestras`);
        navigate(`/organizador/eventos/${eventoId}/palestras`);
      }, 1000);
    }
  };

  // Criar palestra
  const criarPalestra = async () => {
    try {
      if (!user?.profile?.id) {
        throw new Error('Usuário não autenticado');
      }

      const response = await fetch(`${getApiBaseUrl()}/palestras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          evento_id: eventoId,
          titulo: formData.titulo,
          palestrante: formData.palestrante || null,
          data_hora_inicio: formData.data_hora_inicio || null,
          informacoes_adicionais: formData.informacoes_adicionais || null,
          tags_tema: formData.tags_tema,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar palestra');
      }

      const responseData = await response.json();
      console.log('Resposta completa:', responseData);
      
      // Backend retorna {statusCode, message, data}
      const palestra = responseData.data || responseData;
      console.log('Palestra criada:', palestra);
      return palestra.id;
    } catch (error: any) {
      console.error('Erro ao criar palestra:', error);
      toastHook({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a palestra',
        variant: 'destructive'
      });
      return null;
    }
  };

  // Preparar upload de áudio
  const handlePrepareAudioUpload = async () => {
    if (!formData.titulo.trim()) {
      toastHook({
        title: "Erro",
        description: "Por favor, preencha o título antes de continuar",
        variant: "destructive"
      });
      return;
    }

    setPreparingUpload(true);
    const palestraIdNovo = await criarPalestra();
    setPreparingUpload(false);

    if (!palestraIdNovo) {
      toastHook({
        title: "Erro",
        description: "Não foi possível criar registro da palestra",
        variant: "destructive"
      });
    }
  };

  // Callback após transcrição concluída
  const handleAudioUploadComplete = async (texto: string) => {
    setTranscricao(texto);
    toastHook({
      title: 'Transcrição concluída! ✅',
      description: 'Gerando o Livebook automaticamente...'
    });

    // Gerar livebook automaticamente após transcrição
    setProcessing(true);
    setProgress(60);
    await pollProcessingStatus(palestraId!);
  };

  // Upload de arquivo de texto
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setTranscricao(event.target?.result as string);
        toastHook({
          title: "Arquivo carregado",
          description: `${file.name} foi carregado com sucesso`
        });
      };
      reader.readAsText(file);
    }
  };

  // Gerar livebook a partir de texto
  const handleGenerateFromText = async () => {
    if (!formData.titulo.trim()) {
      toastHook({
        title: "Erro",
        description: "Por favor, preencha o título do livebook",
        variant: "destructive"
      });
      return;
    }
    
    if (!transcricao.trim()) {
      toastHook({
        title: "Erro",
        description: "Por favor, insira ou faça upload da transcrição",
        variant: "destructive"
      });
      return;
    }

    // Criar palestra se não existir
    let currentPalestraId = palestraId;
    if (!currentPalestraId) {
      currentPalestraId = await criarPalestra();
      if (!currentPalestraId) {
        toastHook({
          title: "Erro",
          description: "Não foi possível criar registro da palestra",
          variant: "destructive"
        });
        return;
      }
    }

    setIsGenerating(true);
    setProcessing(true);
    setProgress(30);

    try {
      const userId = localStorage.getItem('scribia_user_id');
      const perfil = `${formData.nivel_escolhido}-${formData.formato_escolhido}`;
      
      const metadados = {
        titulo: formData.titulo || undefined,
        palestrante: formData.palestrante || undefined
      };
      
      const { data, error } = await supabase.functions.invoke('generate-livebook', {
        body: {
          transcricao: transcricao,
          perfil: perfil,
          metadados,
          palestraId: currentPalestraId,
          usuarioId: userId
        }
      });
      
      if (error) throw error;
      if (data?.error) {
        throw new Error(data.error);
      }

      setProgress(90);
      
      // Aguardar um pouco e depois verificar status
      await new Promise(resolve => setTimeout(resolve, 2000));
      await pollProcessingStatus(currentPalestraId);

    } catch (error: any) {
      console.error('Erro ao gerar Livebook:', error);
      toastHook({
        title: "Erro ao gerar Livebook",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
      setIsGenerating(false);
      setProcessing(false);
    }
  };

  const pollProcessingStatus = async (palestraIdToCheck: string) => {
    console.log(`🚀 Iniciando polling via RPC para palestra: ${palestraIdToCheck}`);
    let attempts = 0;
    const maxAttempts = 120;

    const checkStatus = async (): Promise<void> => {
      attempts++;
      const progressCalc = 60 + Math.min((attempts / maxAttempts) * 35, 35);
      setProgress(progressCalc);

      const userId = localStorage.getItem('scribia_user_id');
      const { data, error } = await supabase.rpc('scribia_poll_palestra_status', {
        p_palestra_id: palestraIdToCheck,
        p_usuario_id: userId
      });

      console.log(`🔍 Tentativa ${attempts}/${maxAttempts}`, { data, error });

      if (error) {
        console.error('❌ Erro RPC:', error);
        setTimeout(checkStatus, 3000);
        return;
      }

      const result = data as { success: boolean; error?: string; palestra?: { status: string; transcricao?: string }; livebook?: { id: string; status: string; pdf_url?: string; docx_url?: string; html_url?: string; erro_log?: string } };

      if (!result?.success) {
        console.error('❌ Erro da função:', result?.error);
        setProcessing(false);
        setIsGenerating(false);
        toastHook({
          title: 'Erro ao buscar status',
          description: result?.error || 'Erro desconhecido',
          variant: 'destructive'
        });
        return;
      }

      const { palestra: palestraData, livebook: livebookData } = result;

      if (palestraData?.status === 'erro') {
        setProcessing(false);
        setIsGenerating(false);
        toastHook({
          title: 'Erro na transcrição',
          description: palestraData.transcricao || 'Erro ao transcrever áudio',
          variant: 'destructive'
        });
        return;
      }

      if (livebookData && livebookData.status === 'concluido') {
        setProgress(100);
        setProcessing(false);
        setIsGenerating(false);
        setLivebookData(livebookData);
        
        await fetchLivebookContent(livebookData);
        
        setStep('completed');
        toastHook({
          title: 'Livebook gerado! 🎉',
          description: 'Seu resumo está pronto',
        });
        return;
      }

      if (livebookData && livebookData.status === 'erro') {
        setProcessing(false);
        setIsGenerating(false);
        toastHook({
          title: 'Erro ao gerar livebook',
          description: livebookData.erro_log || 'Erro desconhecido',
          variant: 'destructive'
        });
        return;
      }

      if (attempts >= maxAttempts) {
        setProcessing(false);
        setIsGenerating(false);
        toastHook({
          title: 'Tempo limite excedido',
          description: 'O processamento está demorando mais que o esperado.',
          variant: 'destructive'
        });
        return;
      }

      setTimeout(checkStatus, 3000);
    };

    checkStatus();
  };

  const fetchLivebookContent = async (livebook: any) => {
    try {
      if (livebook.html_url) {
        const response = await fetch(livebook.html_url);
        if (response.ok) {
          const content = await response.text();
          setLivebookContent(content);
          return;
        }
      }

      setLivebookContent(`# ${formData.titulo}\n\n**Palestrante:** ${formData.palestrante || 'Não informado'}\n\nLivebook gerado com sucesso!`);
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      setLivebookContent('Livebook gerado com sucesso! Use os botões abaixo para fazer download.');
    }
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/organizador/eventos/${eventoId}/palestras`)}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar para Palestras
        </Button>

        {/* Formulário de Nova Palestra */}
        <Card>
          <CardHeader>
            <CardTitle>Nova Palestra</CardTitle>
            <CardDescription>Preencha as informações básicas</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
                <Label htmlFor="titulo">Título da Palestra *</Label>
                <Input
                  id="titulo"
                  value={formData.titulo}
                  onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                  placeholder="Ex: Introdução ao React"
                />
              </div>

              <div>
                <Label htmlFor="palestrante">Nome do Palestrante</Label>
                <Input
                  id="palestrante"
                  value={formData.palestrante}
                  onChange={(e) => setFormData({ ...formData, palestrante: e.target.value })}
                  placeholder="Ex: João Silva"
                />
              </div>

              <div>
                <Label htmlFor="data_hora_inicio">Data e Hora de Início</Label>
                <Input
                  id="data_hora_inicio"
                  type="datetime-local"
                  value={formData.data_hora_inicio}
                  onChange={(e) => setFormData({ ...formData, data_hora_inicio: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="informacoes_adicionais">Informações Adicionais</Label>
                <Textarea
                  id="informacoes_adicionais"
                  value={formData.informacoes_adicionais}
                  onChange={(e) => setFormData({ ...formData, informacoes_adicionais: e.target.value })}
                  placeholder="Detalhes sobre a palestra, local, etc."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="tags">Tags/Temas</Label>
                <div className="flex gap-2">
                  <Input
                    id="tags"
                    value={currentTag}
                    onChange={(e) => setCurrentTag(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                    placeholder="Digite tags separadas por vírgula (ex: react, javascript, frontend)"
                  />
                  <Button type="button" onClick={handleAddTag}>
                    Adicionar
                  </Button>
                </div>
                {formData.tags_tema.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {formData.tags_tema.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="cursor-pointer"
                        onClick={() => handleRemoveTag(tag)}
                      >
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              <Button 
                onClick={handleBasicInfoSubmit} 
                className="w-full"
                disabled={preparingUpload}
              >
                {preparingUpload ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Criando palestra...
                  </>
                ) : (
                  'Criar Palestra'
                )}
              </Button>
            </CardContent>
          </Card>
      </div>
  );
};

export default PalestraForm;
