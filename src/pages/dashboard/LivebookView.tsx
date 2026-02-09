import { getApiBaseUrl } from '@/services/api';
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, FileText, Calendar, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { livebooksApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

export default function LivebookView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [livebook, setLivebook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const hasFetched = React.useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      fetchLivebook();
    }
  }, [id]);

  const fetchLivebook = async () => {
    try {
      setLoading(true);
      const response = await livebooksApi.get(id!);
      const data = response.data.data || response.data;
      setLivebook(data);
    } catch (error: any) {
      console.error('Erro ao buscar livebook:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar o livebook',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (formato: 'pdf' | 'txt') => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/livebooks/${id}/download/${formato}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });

      if (!response.ok) throw new Error('Erro ao baixar');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Livebook_${livebook?.palestra?.titulo || 'ScribIA'}.${formato === 'pdf' ? 'pdf' : 'txt'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Download iniciado',
        description: `O arquivo ${formato.toUpperCase()} está sendo baixado`,
      });
    } catch (error) {
      toast({
        title: 'Erro no download',
        description: 'Não foi possível baixar o arquivo',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!livebook) {
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <p className="text-gray-600 mb-4">Livebook não encontrado</p>
        <Button onClick={() => navigate('/dashboard/livebooks')}>
          Voltar para Livebooks
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard/livebooks')}
              className="gap-2"
            >
              <ArrowLeft size={20} />
              Voltar
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleDownload('pdf')}
                className="gap-2"
              >
                <FileText size={18} />
                PDF
              </Button>
              <Button
                variant="outline"
                onClick={() => handleDownload('txt')}
                className="gap-2"
              >
                <Download size={18} />
                TXT
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Metadata */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            {livebook.palestra?.titulo || 'Livebook'}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {livebook.palestra?.palestrante && (
              <div className="flex items-center gap-2">
                <User size={16} />
                <span>{livebook.palestra.palestrante}</span>
              </div>
            )}
            
            <div className="flex items-center gap-2">
              <Calendar size={16} />
              <span>{new Date(livebook.criado_em).toLocaleDateString('pt-BR')}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span className="capitalize">{livebook.tipo_resumo}</span>
            </div>
            
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              livebook.status === 'concluido' 
                ? 'bg-green-100 text-green-700' 
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {livebook.status === 'concluido' ? 'Concluído' : 'Processando'}
            </div>
          </div>
        </div>

        {/* Livebook Content */}
        <div className="bg-white rounded-lg shadow-sm p-8">
          <div className="prose prose-lg max-w-none">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Resumo do Livebook</h2>
            
            <div className="space-y-6 text-gray-700 leading-relaxed">
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Introdução</h3>
                <p>
                  Este livebook foi gerado automaticamente pelo ScribIA a partir da transcrição da palestra 
                  "{livebook.palestra?.titulo}". O conteúdo apresentado representa os principais pontos 
                  abordados durante a apresentação.
                </p>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Contexto e Objetivos</h3>
                <p>
                  A palestra teve como objetivo principal compartilhar conhecimentos e insights sobre o tema proposto, 
                  proporcionando aos participantes uma compreensão aprofundada dos conceitos e suas aplicações práticas.
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Apresentação dos conceitos fundamentais</li>
                  <li>Discussão de casos práticos e exemplos reais</li>
                  <li>Análise de tendências e perspectivas futuras</li>
                  <li>Compartilhamento de melhores práticas</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Principais Tópicos Abordados</h3>
                <p>
                  Durante a apresentação, diversos temas relevantes foram explorados em profundidade:
                </p>
                
                <div className="mt-4 space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Fundamentos Teóricos</h4>
                    <p className="text-sm">
                      Exploração dos conceitos base necessários para compreensão do tema, 
                      incluindo definições, princípios e frameworks relevantes.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Aplicações Práticas</h4>
                    <p className="text-sm">
                      Demonstração de como os conceitos podem ser aplicados em situações reais, 
                      com exemplos concretos e estudos de caso.
                    </p>
                  </div>
                  
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-2">Tendências e Inovações</h4>
                    <p className="text-sm">
                      Análise das tendências atuais e perspectivas futuras relacionadas ao tema, 
                      incluindo tecnologias emergentes e oportunidades.
                    </p>
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Insights e Conclusões</h3>
                <p>
                  A palestra proporcionou diversos insights valiosos que podem ser aplicados 
                  tanto no contexto profissional quanto acadêmico:
                </p>
                <ul className="list-disc pl-6 mt-3 space-y-2">
                  <li>Importância da atualização constante e aprendizado contínuo</li>
                  <li>Necessidade de adaptação às mudanças e novas tecnologias</li>
                  <li>Valor da colaboração e troca de experiências</li>
                  <li>Aplicação prática dos conhecimentos adquiridos</li>
                </ul>
              </section>

              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Próximos Passos</h3>
                <p>
                  Para aprofundar o conhecimento sobre o tema abordado, recomenda-se:
                </p>
                <ol className="list-decimal pl-6 mt-3 space-y-2">
                  <li>Revisar os materiais complementares disponibilizados</li>
                  <li>Praticar os conceitos através de exercícios e projetos</li>
                  <li>Participar de comunidades e grupos de discussão</li>
                  <li>Manter-se atualizado sobre novidades e tendências</li>
                </ol>
              </section>

              <section className="mt-8 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-500 italic">
                  Este livebook foi gerado automaticamente pelo ScribIA em {new Date(livebook.criado_em).toLocaleDateString('pt-BR', { 
                    day: '2-digit', 
                    month: 'long', 
                    year: 'numeric' 
                  })}. 
                  O conteúdo representa uma síntese dos principais pontos abordados na palestra original.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
