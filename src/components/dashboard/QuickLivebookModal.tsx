import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AudioRecorder } from "@/components/audio/AudioRecorder";
import { AudioUploader } from "@/components/audio/AudioUploader";
import { LivebookProgress } from "@/components/dashboard/LivebookProgress";
import { useCustomAuth } from "@/hooks/useCustomAuth";
import { palestrasApi } from "@/services/api";
import { toast } from "sonner";
import { Mic, Upload, Loader2 } from "lucide-react";
import { uploadAudioToTranscribe } from "@/lib/audioUpload";

interface QuickLivebookModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPalestraCreated?: (palestraId: string) => void;
  eventoId?: string;
  eventoNome?: string;
  defaultTab?: "record" | "upload";
}

export function QuickLivebookModal({ open, onOpenChange, onPalestraCreated, eventoId, eventoNome, defaultTab = "record" }: QuickLivebookModalProps) {
  const { user } = useCustomAuth();
  const [titulo, setTitulo] = useState("");
  const [palestrante, setPalestrante] = useState("");
  const [currentTab, setCurrentTab] = useState<"record" | "upload">(defaultTab);
  const [palestraId, setPalestraId] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userPerfil, setUserPerfil] = useState<string | null>(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showProgress, setShowProgress] = useState(false);
  
  // Estados para seletor de perfil
  const [nivelEscolhido, setNivelEscolhido] = useState<string | null>(null);
  const [formatoEscolhido, setFormatoEscolhido] = useState<string | null>(null);

  // Buscar preferências do usuário
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (!user?.id) return;

      const { data } = await supabase
        .from("scribia_usuarios")
        .select("nivel_preferido, formato_preferido, perfil_definido")
        .eq("id", user.id)
        .single();

      if (data?.nivel_preferido && data?.formato_preferido) {
        setUserPerfil(`${data.nivel_preferido}-${data.formato_preferido}`);
        // Pré-selecionar perfil do usuário
        setNivelEscolhido(data.nivel_preferido);
        setFormatoEscolhido(data.formato_preferido);
      }
    };

    fetchUserProfile();
  }, [user?.id]);

  // Resetar tab quando modal abre
  useEffect(() => {
    if (open) {
      setCurrentTab(defaultTab);
    }
  }, [open, defaultTab]);

  // Criar palestra
  const createPalestra = async () => {
    try {
      if (!user?.profile?.id) {
        throw new Error("Usuário não autenticado");
      }

      if (!titulo.trim()) {
        throw new Error("Por favor, preencha o título antes de continuar");
      }

      // Usar perfil escolhido pelo usuário no modal
      const nivel = nivelEscolhido;
      const formato = formatoEscolhido;

      console.log('🎬 Criando palestra:', { titulo, palestrante, nivel, formato });

      const response = await palestrasApi.create({
        evento_id: eventoId || null,
        titulo: titulo || "Livebook Geral",
        palestrante: palestrante || "Não informado",
        status: "planejada",
        nivel_escolhido: nivel,
        formato_escolhido: formato,
        origem_classificacao: "manual",
      });

      const palestra = response.data.data || response.data;
      console.log('✅ Palestra criada:', palestra.id);
      return palestra.id;
    } catch (error: any) {
      console.error("❌ Erro ao criar palestra:", error);
      console.error("Response:", error.response?.data);
      toast.error(error.response?.data?.message || error.message || "Não foi possível criar palestra");
      return null;
    }
  };

  // Processar áudio gravado
  const handleRecordingComplete = async (blob: Blob, duration: number) => {
    console.log(`🎙️ Gravação concluída: ${duration}s`);
    
    if (!titulo.trim()) {
      toast.error("Preencha o título antes de processar");
      return;
    }

    setIsProcessing(true);

    try {
      // Criar palestra primeiro
      const newPalestraId = await createPalestra();
      if (!newPalestraId) {
        console.error("❌ Falha ao criar palestra");
        setIsProcessing(false);
        return;
      }

      console.log("✅ Palestra criada:", newPalestraId);
      setPalestraId(newPalestraId);
      
      // IMPORTANTE: Definir showProgress ANTES de iniciar processamento
      console.log("📊 Ativando exibição de progresso");
      setShowProgress(true);

      // Fazer upload do blob gravado
      const file = new File([blob], "gravacao.webm", { type: "audio/webm" });
      await processAudioFile(file, newPalestraId);
    } catch (error: any) {
      console.error("❌ Erro ao processar gravação:", error);
      toast.error(error.message || "Erro ao processar gravação");
      setIsProcessing(false);
      setShowProgress(false);
    }
  };

  // Gerar Livebook com GPT-4o
  const gerarLivebook = async (palestraIdToUse: string, transcricao: string) => {
    try {
      console.log('📚 Gerando Livebook com GPT-4o...');
      
      const metadados = {
        titulo: titulo || undefined,
        palestrante: palestrante || undefined
      };
      
      // Montar perfil escolhido
      const perfilEscolhido = nivelEscolhido && formatoEscolhido 
        ? `${nivelEscolhido}-${formatoEscolhido}` 
        : userPerfil;
      
      const { data, error } = await supabase.functions.invoke('generate-livebook', {
        body: {
          transcricao: transcricao,
          perfil: perfilEscolhido,
          metadados,
          palestraId: palestraIdToUse,
          usuarioId: user?.id
        }
      });
      
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      
      console.log('✅ Livebook gerado com sucesso!');
      toast.success('Livebook gerado com sucesso! 🎉');
      
      return data;
    } catch (error: any) {
      console.error('❌ Erro ao gerar Livebook:', error);
      toast.error(error.message || 'Erro ao gerar Livebook');
      throw error;
    }
  };

  // Processar arquivo de áudio
  const processAudioFile = async (file: File, palestraIdToUse: string) => {
    try {
      if (!user?.profile?.id) throw new Error("Usuário não autenticado");

      console.log("📤 Enviando áudio para transcrição...");
      
      // Upload direto ao Deepgram (< 100MB) ou storage temporário (>= 100MB)
      await uploadAudioToTranscribe(file, user.profile.id, palestraIdToUse);

      console.log("✅ Áudio enviado para transcrição");
      console.log("✅ Transcrição e livebook criados (mock)");
      toast.success("Livebook criado com sucesso!");

      console.log("📊 Processo completo! showProgress:", true, "palestraId:", palestraIdToUse);
      
    } catch (error: any) {
      console.error("❌ Erro ao processar áudio:", error);
      toast.error(error.message || "Erro ao processar áudio");
      setShowProgress(false);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  };

  // Callback do AudioUploader quando upload de arquivo externo completa
  const handleUploadComplete = async (transcricao: string) => {
    toast.success("Transcrição concluída! Gerando Livebook...");

    // Notificar Dashboard para monitorar
    if (palestraId && onPalestraCreated) {
      onPalestraCreated(palestraId);
    }

    // Fechar modal
    resetForm();
    onOpenChange(false);
  };

  // Preparar para modo upload
  const handlePrepareUpload = async () => {
    if (!titulo.trim()) {
      toast.error("Por favor, preencha o título do Livebook");
      return;
    }

    const newPalestraId = await createPalestra();
    if (newPalestraId) {
      setPalestraId(newPalestraId);
      toast.success("Pronto para upload! Selecione seu arquivo de áudio");
    }
  };

  // Preparar para modo gravação
  const handlePrepareRecording = () => {
    if (!titulo.trim()) {
      toast.error("Por favor, preencha o título do Livebook");
      return;
    }
    setShowRecorder(true);
  };

  const resetForm = () => {
    setTitulo("");
    setPalestrante("");
    setPalestraId(null);
    setIsProcessing(false);
    setCurrentTab(defaultTab);
    setShowRecorder(false);
    setShowProgress(false);
    // Resetar perfil para padrão do usuário
    const [nivel, formato] = userPerfil ? userPerfil.split("-") : [null, null];
    setNivelEscolhido(nivel);
    setFormatoEscolhido(formato);
  };
  
  const handleLivebookComplete = (livebookId: string) => {
    toast.success("Livebook gerado com sucesso! 🎉");
    
    if (onPalestraCreated && palestraId) {
      onPalestraCreated(palestraId);
    }
    
    setTimeout(() => {
      resetForm();
      onOpenChange(false);
    }, 2000);
  };

  const handleTabChange = (value: string) => {
    setCurrentTab(value as "record" | "upload");
  };

  const handleClose = (isOpen: boolean) => {
    if (!isOpen && !isProcessing) {
      resetForm();
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center">
            🎤 {eventoNome ? `Criar Livebook - ${eventoNome}` : 'Criar Livebook Rápido'}
          </DialogTitle>
          <DialogDescription className="text-center">
            Grave ou faça upload de um áudio para gerar seu Livebook personalizado
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mostrar progresso do Livebook se estiver processando */}
          {showProgress && palestraId ? (
            <LivebookProgress 
              palestraId={palestraId}
              userId={user?.id || ''}
              onComplete={handleLivebookComplete}
            />
          ) : (
            <>
              {/* Seletor de Perfil */}
              <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-1">📊 Escolha seu Perfil</h3>
                  <p className="text-sm text-muted-foreground">
                    Selecione o nível de conhecimento e formato do Livebook
                  </p>
                </div>

                {/* Nível de Conhecimento */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Nível de Conhecimento</Label>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      type="button"
                      variant={nivelEscolhido === 'junior' ? 'default' : 'outline'}
                      onClick={() => setNivelEscolhido('junior')}
                      disabled={isProcessing || showRecorder || !!palestraId}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">🌱</span>
                      <span className="text-xs font-semibold">Júnior</span>
                    </Button>
                    <Button
                      type="button"
                      variant={nivelEscolhido === 'pleno' ? 'default' : 'outline'}
                      onClick={() => setNivelEscolhido('pleno')}
                      disabled={isProcessing || showRecorder || !!palestraId}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">🎯</span>
                      <span className="text-xs font-semibold">Pleno</span>
                    </Button>
                    <Button
                      type="button"
                      variant={nivelEscolhido === 'senior' ? 'default' : 'outline'}
                      onClick={() => setNivelEscolhido('senior')}
                      disabled={isProcessing || showRecorder || !!palestraId}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">🚀</span>
                      <span className="text-xs font-semibold">Sênior</span>
                    </Button>
                  </div>
                </div>

                {/* Formato */}
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Formato do Resumo</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      type="button"
                      variant={formatoEscolhido === 'compacto' ? 'default' : 'outline'}
                      onClick={() => setFormatoEscolhido('compacto')}
                      disabled={isProcessing || showRecorder || !!palestraId}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">⚡</span>
                      <span className="text-xs font-semibold">Compacto</span>
                      <span className="text-[10px] text-muted-foreground">Resumido</span>
                    </Button>
                    <Button
                      type="button"
                      variant={formatoEscolhido === 'completo' ? 'default' : 'outline'}
                      onClick={() => setFormatoEscolhido('completo')}
                      disabled={isProcessing || showRecorder || !!palestraId}
                      className="flex flex-col items-center gap-1 h-auto py-3"
                    >
                      <span className="text-2xl">📚</span>
                      <span className="text-xs font-semibold">Completo</span>
                      <span className="text-[10px] text-muted-foreground">Detalhado</span>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Inputs de Título e Palestrante */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="titulo">Título do Livebook *</Label>
                  <Input
                    id="titulo"
                    placeholder="Ex: Palestra sobre Inteligência Artificial"
                    value={titulo}
                    onChange={(e) => setTitulo(e.target.value)}
                    disabled={isProcessing || showRecorder || !!palestraId}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="palestrante">Palestrante</Label>
                  <Input
                    id="palestrante"
                    placeholder="Nome do palestrante (opcional)"
                    value={palestrante}
                    onChange={(e) => setPalestrante(e.target.value)}
                    disabled={isProcessing || showRecorder || !!palestraId}
                  />
                </div>
              </div>

          {/* Tabs: Gravar ou Upload */}
          <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="record" disabled={isProcessing || showRecorder || !!palestraId}>
                <Mic className="w-4 h-4 mr-2" />
                Gravar Agora
              </TabsTrigger>
              <TabsTrigger value="upload" disabled={isProcessing || showRecorder || !!palestraId}>
                <Upload className="w-4 h-4 mr-2" />
                Upload de Arquivo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="record" className="space-y-4 mt-4">
              {isProcessing ? (
                <div className="text-center space-y-4 py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
                  <p className="text-sm text-muted-foreground">Processando sua gravação...</p>
                </div>
              ) : !showRecorder ? (
                <div className="text-center space-y-4 py-8">
                  <p className="text-sm text-muted-foreground">
                    Grave seu áudio diretamente pelo navegador
                  </p>
                  <Button onClick={handlePrepareRecording} size="lg" className="w-full">
                    <Mic className="w-5 h-5 mr-2" />
                    Iniciar Gravação
                  </Button>
                </div>
              ) : (
                <AudioRecorder onRecordingComplete={handleRecordingComplete} maxDuration={7200} />
              )}
            </TabsContent>

            <TabsContent value="upload" className="space-y-4 mt-4">
              {!palestraId ? (
                <div className="text-center space-y-4 py-8">
                  <p className="text-sm text-muted-foreground">
                    Preencha o título e clique abaixo para preparar o upload
                  </p>
                  <Button onClick={handlePrepareUpload} size="lg" className="w-full">
                    <Upload className="w-5 h-5 mr-2" />
                    Preparar para Upload
                  </Button>
                </div>
              ) : (
                <AudioUploader palestraId={palestraId} onUploadComplete={handleUploadComplete} />
              )}
            </TabsContent>
          </Tabs>

              <p className="text-xs text-muted-foreground text-center">
                💡 Seu Livebook será gerado automaticamente após o processamento
              </p>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
