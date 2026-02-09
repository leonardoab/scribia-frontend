import { getApiBaseUrl } from '@/services/api';
import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { livebooksApi } from '@/services/api';
import { AudioUploader } from '@/components/audio/AudioUploader';
import { BookOpen, Upload, Loader2, Download, Mic, FileText, Save } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const GerarLivebook = () => {
  const { user } = useCustomAuth();
  const [searchParams] = useSearchParams();
  const [transcricao, setTranscricao] = useState('');
  const [titulo, setTitulo] = useState('');
  const [palestrante, setPalestrante] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [livebookGerado, setLivebookGerado] = useState('');
  const [palestraId, setPalestraId] = useState<string | null>(null);
  const [uploadMode, setUploadMode] = useState<'audio' | 'text'>('audio');
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [txtUrl, setTxtUrl] = useState<string | null>(null);
  const [livebookId, setLivebookId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [preparingUpload, setPreparingUpload] = useState(false);
  const [relacionarEvento, setRelacionarEvento] = useState(false);
  const [eventoId, setEventoId] = useState<string>('');
  const [eventos, setEventos] = useState<any[]>([]);
  const [palestras, setPalestras] = useState<any[]>([]);
  const [palestraSelecionada, setPalestraSelecionada] = useState<string>('');
  const { toast } = useToast();
  const hasFetchedEventos = React.useRef(false);

  // Registrar intenção ao acessar a página
  React.useEffect(() => {
    livebooksApi.registrarIntencao('gerar_livebook').catch(console.error);
  }, []);

  // Buscar eventos do usuário
  React.useEffect(() => {
    const fetchEventos = async () => {
      if (!user?.profile?.id || hasFetchedEventos.current) return;
      hasFetchedEventos.current = true;
      
      try {
        const response = await fetch(`${getApiBaseUrl()}/eventos`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Eventos carregados:', data);
          const eventosArray = data.data?.eventos || data.eventos || [];
          console.log('Array de eventos:', eventosArray);
          setEventos(eventosArray);
        }
      } catch (error) {
        console.error('Erro ao buscar eventos:', error);
      }
    };
    if (relacionarEvento) {
      hasFetchedEventos.current = false;
      fetchEventos();
    }
  }, [relacionarEvento, user?.profile?.id]);

  // Pré-selecionar palestra da URL
  React.useEffect(() => {
    const palestraIdFromUrl = searchParams.get('palestra');
    if (palestraIdFromUrl) {
      setRelacionarEvento(true);
      setPalestraSelecionada(palestraIdFromUrl);
      
      // Buscar todos os eventos para encontrar o evento da palestra
      const findEventoFromPalestra = async () => {
        try {
          const response = await fetch(`${getApiBaseUrl()}/eventos`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            }
          });
          if (response.ok) {
            const data = await response.json();
            const eventosArray = data.data?.eventos || data.eventos || [];
            
            // Buscar em cada evento até encontrar a palestra
            for (const evento of eventosArray) {
              const palestraResponse = await fetch(`${getApiBaseUrl()}/eventos/${evento.id}/palestras`, {
                headers: {
                  'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
                }
              });
              if (palestraResponse.ok) {
                const palestraData = await palestraResponse.json();
                const palestrasArray = palestraData.data?.palestras || palestraData.data || palestraData || [];
                const palestraEncontrada = palestrasArray.find((p: any) => p.id === palestraIdFromUrl);
                if (palestraEncontrada) {
                  setEventoId(evento.id);
                  break;
                }
              }
            }
          }
        } catch (error) {
          console.error('Erro ao buscar evento da palestra:', error);
        }
      };
      findEventoFromPalestra();
    }
  }, [searchParams]);

  // Buscar palestras do evento selecionado
  React.useEffect(() => {
    const fetchPalestras = async () => {
      if (!eventoId) return;
      try {
        const response = await fetch(`${getApiBaseUrl()}/eventos/${eventoId}/palestras`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
          }
        });
        if (response.ok) {
          const data = await response.json();
          console.log('Palestras carregadas:', data);
          setPalestras(data.data?.palestras || data.data || data || []);
        }
      } catch (error) {
        console.error('Erro ao buscar palestras:', error);
      }
    };
    fetchPalestras();
  }, [eventoId]);

  // Criar palestra temporária para upload de áudio
  const criarPalestra = async () => {
    try {
      if (!user?.profile?.id) {
        throw new Error('Usuário não autenticado');
      }
      
      if (!titulo.trim()) {
        throw new Error('Por favor, preencha o título antes de continuar');
      }
      
      const response = await fetch(`${getApiBaseUrl()}/palestras`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          titulo: titulo || 'Palestra sem título',
          palestrante: palestrante || 'Não informado',
          status: 'planejada',
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar palestra');
      }

      const responseData = await response.json();
      const palestra = responseData.data || responseData;
      const palestraIdNovo = palestra.id;
      setPalestraId(palestraIdNovo);
      
      toast({
        title: 'Preparado para upload! ✅',
        description: 'Agora você pode fazer upload do áudio'
      });
      
      return palestraIdNovo;
    } catch (error: any) {
      console.error('Erro ao criar palestra:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Não foi possível criar a palestra',
        variant: 'destructive'
      });
      return null;
    }
  };

  const handleAudioUploadComplete = async (texto: string) => {
    setTranscricao(texto);
    toast({
      title: 'Transcrição concluída! ✅',
      description: 'Gerando o Livebook automaticamente...'
    });

    // Gerar livebook automaticamente após transcrição
    await handleGenerate(texto);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = event => {
        setTranscricao(event.target?.result as string);
        toast({
          title: "Arquivo carregado",
          description: `${file.name} foi carregado com sucesso`
        });
      };
      reader.readAsText(file);
    }
  };

  const handleGenerate = async (transcricaoTexto?: string) => {
    const textoParaGerar = transcricaoTexto || transcricao;

    if (!titulo.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título do livebook",
        variant: "destructive"
      });
      return;
    }
    
    if (!textoParaGerar.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira ou faça upload da transcrição",
        variant: "destructive"
      });
      return;
    }

    if (relacionarEvento && (!eventoId || !palestraSelecionada)) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um evento e uma palestra",
        variant: "destructive"
      });
      return;
    }

    // Usar palestra selecionada se houver relacionamento com evento
    let currentPalestraId = relacionarEvento ? palestraSelecionada : null;

    setIsGenerating(true);
    setLivebookGerado('');
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/livebooks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          ...(currentPalestraId && { palestra_id: currentPalestraId }),
          titulo: titulo,
          tipo_resumo: 'completo',
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao gerar livebook');
      }

      const responseData = await response.json();
      const livebook = responseData.data || responseData;
      
      setLivebookGerado('Livebook gerado com sucesso! Verifique em "Meus Livebooks".');
      setLivebookId(livebook.id);

      toast({
        title: "Livebook gerado e salvo com sucesso! ✅",
        description: "Seu Livebook está disponível em 'Meus Livebooks'"
      });

      // Limpar formulário
      setTranscricao('');
      setTitulo('');
      setPalestrante('');
      setPalestraId(null);
      setRelacionarEvento(false);
      setEventoId('');
      setPalestraSelecionada('');

    } catch (error: any) {
      console.error('Erro ao gerar Livebook:', error);
      toast({
        title: "Erro ao gerar Livebook",
        description: error.message || "Tente novamente mais tarde",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([livebookGerado], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Livebook_${titulo || 'ScribIA'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const handleDownloadText = () => {
    const blob = new Blob([livebookGerado], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Livebook_${titulo || 'ScribIA'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const parseMarkdownToSections = (markdown: string) => {
    const lines = markdown.split('\n');
    const sections = {
      resumo: '',
      biografia: '',
      topicos: [] as Array<{
        titulo: string;
        conceito: string;
        pontosChave: string[];
        aplicacao: string;
      }>
    };
    
    let currentSection = '';
    let currentTopico: any = null;
    let collectingConceito = false;
    let collectingAplicacao = false;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.match(/^#+ (RESUMO|Resumo Executivo|Resumo)/i)) {
        currentSection = 'resumo';
        continue;
      }
      if (line.match(/^#+ (SOBRE|Biografia|Palestrante|Sobre o Palestrante)/i)) {
        currentSection = 'biografia';
        continue;
      }
      if (line.match(/^#+ (TÓPICOS|Tópico|[A-Z\s]{3,})/i) && line.length < 80) {
        if (currentTopico) {
          sections.topicos.push(currentTopico);
        }
        
        currentTopico = {
          titulo: line.replace(/^#+\s*/, '').replace(/\*\*/g, ''),
          conceito: '',
          pontosChave: [],
          aplicacao: ''
        };
        currentSection = 'topico';
        collectingConceito = false;
        collectingAplicacao = false;
        continue;
      }
      
      if (currentSection === 'resumo' && line && !line.startsWith('#')) {
        sections.resumo += (sections.resumo ? ' ' : '') + line;
      }
      
      if (currentSection === 'biografia' && line && !line.startsWith('#')) {
        sections.biografia += (sections.biografia ? ' ' : '') + line;
      }
      
      if (currentSection === 'topico' && currentTopico) {
        if (line.match(/^\*?\*?Conceito:?\*?\*?/i)) {
          collectingConceito = true;
          collectingAplicacao = false;
          continue;
        }
        if (line.match(/^\*?\*?(Pontos[- ]chave|Principais pontos):?\*?\*?/i)) {
          collectingConceito = false;
          collectingAplicacao = false;
          continue;
        }
        if (line.match(/^\*?\*?Aplicação:?\*?\*?/i)) {
          collectingConceito = false;
          collectingAplicacao = true;
          continue;
        }
        
        if (collectingConceito && line && !line.startsWith('#')) {
          currentTopico.conceito += (currentTopico.conceito ? ' ' : '') + line;
        }
        
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const ponto = line.replace(/^[- *]+/, '').trim();
          if (ponto) {
            currentTopico.pontosChave.push(ponto);
          }
        }
        
        if (collectingAplicacao && line && !line.startsWith('#') && !line.startsWith('-')) {
          currentTopico.aplicacao += (currentTopico.aplicacao ? ' ' : '') + line;
        }
      }
    }
    
    if (currentTopico) {
      sections.topicos.push(currentTopico);
    }
    
    return sections;
  };

  const handleDownloadPDF = async () => {
    if (!livebookGerado) {
      toast({
        title: 'Erro',
        description: 'Nenhum livebook gerado ainda',
        variant: 'destructive'
      });
      return;
    }

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      let currentY = margin;

      const sections = parseMarkdownToSections(livebookGerado);

      doc.setFontSize(9);
      doc.setTextColor(150, 150, 150);
      doc.text('Documento gerado por Scribia - ' + new Date().toLocaleString('pt-BR'), margin, 10);
      
      currentY = 25;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(0, 0, 0);
      const titleLines = doc.splitTextToSize(titulo || 'Livebook', pageWidth - 2 * margin);
      doc.text(titleLines, margin, currentY);
      currentY += titleLines.length * 10 + 10;
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('METADADOS', margin, currentY);
      currentY += 10;
      
      (autoTable as any)(doc, {
        startY: currentY,
        head: [],
        body: [
          ['TÍTULO', titulo || 'Sem título'],
          ['PALESTRANTE', palestrante || 'Não especificado'],
          ['PERFIL', userPerfil.replace('-', ' - ').toUpperCase()],
          ['DATA DE GERAÇÃO', new Date().toLocaleDateString('pt-BR')]
        ],
        theme: 'grid',
        styles: { fontSize: 10, cellPadding: 5 },
        columnStyles: {
          0: { cellWidth: 45, fontStyle: 'bold', fillColor: [240, 240, 240] },
          1: { cellWidth: 125 }
        },
        headStyles: { fillColor: [66, 66, 66] }
      });
      
      currentY = (doc as any).lastAutoTable.finalY + 15;
      
      if (sections.resumo) {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(0, 0, 0);
        doc.text('RESUMO EXECUTIVO', margin, currentY);
        currentY += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const resumoLines = doc.splitTextToSize(sections.resumo, pageWidth - 2 * margin);
        doc.text(resumoLines, margin, currentY);
        currentY += resumoLines.length * 6 + 10;
      }
      
      if (sections.biografia) {
        if (currentY > pageHeight - 50) {
          doc.addPage();
          currentY = margin;
        }
        
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('SOBRE O PALESTRANTE', margin, currentY);
        currentY += 8;
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        const bioLines = doc.splitTextToSize(sections.biografia, pageWidth - 2 * margin);
        doc.text(bioLines, margin, currentY);
        currentY += bioLines.length * 6 + 10;
      }
      
      if (sections.topicos.length > 0) {
        doc.addPage();
        currentY = margin;
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('TÓPICOS PRINCIPAIS', margin, currentY);
        currentY += 12;
        
        sections.topicos.forEach((topico, index) => {
          if (currentY > pageHeight - 70) {
            doc.addPage();
            currentY = margin;
          }
          
          doc.setFontSize(13);
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(0, 0, 0);
          const topicoTitle = `${index + 1}. ${topico.titulo}`;
          const topicoTitleLines = doc.splitTextToSize(topicoTitle, pageWidth - 2 * margin);
          doc.text(topicoTitleLines, margin, currentY);
          currentY += topicoTitleLines.length * 7 + 5;
          
          if (topico.conceito) {
            if (currentY > pageHeight - 40) {
              doc.addPage();
              currentY = margin;
            }
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Conceito:', margin, currentY);
            currentY += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const conceitoLines = doc.splitTextToSize(topico.conceito, pageWidth - 2 * margin);
            doc.text(conceitoLines, margin, currentY);
            currentY += conceitoLines.length * 6 + 5;
          }
          
          if (topico.pontosChave.length > 0) {
            if (currentY > pageHeight - 40) {
              doc.addPage();
              currentY = margin;
            }
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Pontos-chave:', margin, currentY);
            currentY += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            topico.pontosChave.forEach(ponto => {
              if (currentY > pageHeight - 20) {
                doc.addPage();
                currentY = margin;
              }
              
              const pontoLines = doc.splitTextToSize('• ' + ponto, pageWidth - 2 * margin - 5);
              doc.text(pontoLines, margin + 5, currentY);
              currentY += pontoLines.length * 6 + 2;
            });
            currentY += 3;
          }
          
          if (topico.aplicacao) {
            if (currentY > pageHeight - 40) {
              doc.addPage();
              currentY = margin;
            }
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.text('Aplicação:', margin, currentY);
            currentY += 6;
            
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            const aplicacaoLines = doc.splitTextToSize(topico.aplicacao, pageWidth - 2 * margin);
            doc.text(aplicacaoLines, margin, currentY);
            currentY += aplicacaoLines.length * 6 + 5;
          }
          
          currentY += 8;
        });
      }

      doc.save(`Livebook_${titulo.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}.pdf`);
      
      toast({
        title: 'PDF gerado com sucesso! 📄',
        description: 'Download iniciado com formatação profissional'
      });
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast({
        title: 'Erro ao gerar PDF',
        description: (error as Error).message,
        variant: 'destructive'
      });
    }
  };

  const handleDownloadTxtFormatted = async () => {
    if (txtUrl) {
      try {
        const response = await fetch(txtUrl);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Livebook_${titulo || 'ScribIA'}_${new Date().getTime()}.txt`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } catch (error) {
        console.error('Erro ao baixar TXT:', error);
        handleDownloadText();
      }
    } else {
      handleDownloadText();
    }
  };

  const handlePrepareAudioUpload = async () => {
    if (!titulo.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, preencha o título antes de fazer upload do áudio",
        variant: "destructive"
      });
      return;
    }

    setPreparingUpload(true);
    await criarPalestra();
    setPreparingUpload(false);
  };

  return (
    <div className="w-full px-4 sm:px-6 py-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="h-8 w-8 text-purple-600" />
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">📚 Criar Livebook Geral</h1>
          <p className="text-sm text-muted-foreground">Transforme transcrições em resumos inteligentes personalizados</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Input */}
        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Informações do Livebook</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="titulo">Título do Livebook *</Label>
                <Input 
                  id="titulo" 
                  value={titulo} 
                  onChange={e => setTitulo(e.target.value)} 
                  placeholder="Ex: Inovação em Inteligência Artificial" 
                  required 
                />
              </div>
              <div>
                <Label htmlFor="palestrante">Apresentador (opcional)</Label>
                <Input 
                  id="palestrante" 
                  value={palestrante} 
                  onChange={e => setPalestrante(e.target.value)} 
                  placeholder="Ex: Dr. João Silva - CTO na TechCorp" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Inclua nome, cargo e empresa se desejar
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="relacionar"
                  checked={relacionarEvento}
                  onChange={(e) => {
                    setRelacionarEvento(e.target.checked);
                    if (!e.target.checked) {
                      setEventoId('');
                      setPalestraSelecionada('');
                    }
                  }}
                  className="h-4 w-4"
                />
                <Label htmlFor="relacionar" className="cursor-pointer">
                  Relacionar com evento e palestra existente
                </Label>
              </div>

              {relacionarEvento && (
                <>
                  <div>
                    <Label htmlFor="evento">Evento *</Label>
                    <Select value={eventoId} onValueChange={(value) => {
                      setEventoId(value);
                      setPalestraSelecionada('');
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um evento" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.isArray(eventos) && eventos.map((evento) => (
                          <SelectItem key={evento.id} value={evento.id}>
                            {evento.nome_evento}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {eventoId && (
                    <div>
                      <Label htmlFor="palestra">Palestra *</Label>
                      <Select value={palestraSelecionada} onValueChange={setPalestraSelecionada}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma palestra" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.isArray(palestras) && palestras.map((palestra) => (
                            <SelectItem key={palestra.id} value={palestra.id}>
                              {palestra.titulo}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>

          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Transcrição da Palestra</h2>
            
            <Tabs value={uploadMode} onValueChange={v => setUploadMode(v as 'audio' | 'text')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Mic className="h-4 w-4" />
                  Upload de Áudio
                </TabsTrigger>
                <TabsTrigger value="text" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Transcrição Manual
                </TabsTrigger>
              </TabsList>

              <TabsContent value="audio" className="space-y-4">
                <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-900 dark:text-blue-100">
                    <strong>🎤 Fluxo automático:</strong><br />
                    1. Preencha o título<br />
                    2. Faça upload do áudio<br />
                    3. A transcrição e geração do livebook serão automáticas
                  </p>
                </div>

                {!palestraId ? (
                  <Button 
                    onClick={handlePrepareAudioUpload} 
                    className="w-full" 
                    size="lg"
                    disabled={!titulo.trim() || preparingUpload}
                  >
                    {preparingUpload ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Preparando...
                      </>
                    ) : (
                      <>
                        <Mic className="h-5 w-5 mr-2" />
                        Iniciar Upload de Áudio
                      </>
                    )}
                  </Button>
                ) : (
                  <AudioUploader 
                    palestraId={palestraId} 
                    onUploadComplete={handleAudioUploadComplete}
                  />
                )}
              </TabsContent>

              <TabsContent value="text" className="space-y-4">
                <div>
                  <Label htmlFor="file-upload" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:border-purple-400 transition-colors">
                      <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground">Clique para fazer upload de arquivo .txt</p>
                    </div>
                  </Label>
                  <Input 
                    id="file-upload" 
                    type="file" 
                    accept=".txt" 
                    onChange={handleFileUpload} 
                    className="hidden" 
                  />
                </div>
                
                <div className="text-center text-muted-foreground text-sm">ou</div>
                
                <div>
                  <Textarea 
                    value={transcricao} 
                    onChange={e => setTranscricao(e.target.value)} 
                    placeholder="Cole a transcrição da palestra aqui..." 
                    className="min-h-[300px] font-mono text-sm" 
                  />
                </div>
              </TabsContent>
            </Tabs>

            {/* Botão Gerar - apenas para modo texto */}
            {uploadMode === 'text' && (
              <Button 
                onClick={() => handleGenerate()} 
                disabled={isGenerating || !transcricao.trim() || !userPerfil || !titulo.trim()} 
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 mt-4" 
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Gerando Livebook com GPT-4o...
                  </>
                ) : (
                  <>
                    <BookOpen className="h-5 w-5 mr-2" />
                    Gerar e Salvar Livebook
                  </>
                )}
              </Button>
            )}

            {/* Indicador para modo áudio */}
            {uploadMode === 'audio' && isGenerating && (
              <div className="mt-4 flex items-center justify-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                <Loader2 className="h-4 w-4 mr-2 animate-spin text-blue-500" />
                <span className="text-sm text-blue-700 dark:text-blue-300">
                  Gerando Livebook automaticamente...
                </span>
              </div>
            )}
          </Card>
        </div>

        {/* Coluna Direita - Output */}
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Livebook Gerado</h2>
              {livebookGerado && (
                <div className="flex gap-2 flex-wrap">
                  <Button 
                    onClick={handleDownloadPDF} 
                    variant="outline" 
                    size="sm" 
                    title="Download PDF"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button 
                    onClick={handleDownloadTxtFormatted} 
                    variant="outline" 
                    size="sm" 
                    title="Download TXT formatado"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    TXT
                  </Button>
                  <Button 
                    onClick={handleDownloadMarkdown} 
                    variant="outline" 
                    size="sm" 
                    title="Download Markdown"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    MD
                  </Button>
                </div>
              )}
            </div>
            
            {isGenerating ? (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                <p>Gerando seu Livebook personalizado...</p>
                <p className="text-sm mt-2">Isso pode levar alguns momentos</p>
              </div>
            ) : livebookGerado ? (
              <>
                <div className="prose prose-sm max-w-none">
                  <div className="bg-muted/50 rounded-lg p-6 border max-h-[600px] overflow-y-auto">
                    <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
                      {livebookGerado}
                    </pre>
                  </div>
                </div>
                
                {/* Mensagem de sucesso */}
                {livebookId && (
                  <div className="mt-4 p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Livebook salvo com sucesso!
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          Acesse "Meus Livebooks" para visualizar todos os seus livebooks
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                <BookOpen className="h-16 w-16 mb-4" />
                <p>Seu Livebook aparecerá aqui</p>
                <p className="text-sm mt-2">Preencha os campos e faça o upload do áudio ou transcrição</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default GerarLivebook;
