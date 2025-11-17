import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const CriarEvento = () => {
  const navigate = useNavigate();
  const { user } = useCustomAuth();
  const [loading, setLoading] = useState(false);
  const [organizadorId, setOrganizadorId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome_evento: '',
    data_inicio_evento: '',
    data_fim_evento: '',
    tipo_evento: '',
    url_evento: '',
    logo_url: ''
  });

  useEffect(() => {
    const fetchOrganizador = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('scribia_organizadores' as any)
        .select('id')
        .eq('user_id', user.profile.id)
        .maybeSingle();

      if (data) {
        setOrganizadorId((data as any).id);
      } else {
        toast.error('Você precisa completar seu cadastro de organizador primeiro');
        navigate('/organizador/cadastro');
      }
    };

    fetchOrganizador();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizadorId) return;

    setLoading(true);

    try {
      const { data: eventoData, error: eventoError } = await supabase
        .from('scribia_eventos')
        .insert({
          organizador_id: organizadorId,
          usuario_id: user!.profile.id,
          nome_evento: formData.nome_evento,
          data_inicio: formData.data_inicio_evento || null,
          data_fim: formData.data_fim_evento || null,
          tipo_evento: formData.tipo_evento || null,
          url_evento: formData.url_evento || null,
          logo_url: formData.logo_url || null,
          status_evento: 'ativo'
        })
        .select()
        .single();

      if (eventoError) throw eventoError;

      toast.success('Evento criado com sucesso!');
      navigate(`/organizador/dashboard/${eventoData.id}`);
    } catch (error: any) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      <Button
        variant="ghost"
        onClick={() => navigate('/organizador/eventos')}
        className="mb-4"
      >
        <ArrowLeft className="h-4 w-4 mr-2" />
        Voltar
      </Button>

      <Card>
        <CardHeader>
          <CardTitle>Criar Novo Evento</CardTitle>
          <CardDescription>
            Adicione um novo evento ao seu portfólio de organizador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <div className="md:col-span-2">
                <Label htmlFor="nome_evento">Nome do Evento *</Label>
                <Input
                  id="nome_evento"
                  required
                  value={formData.nome_evento}
                  onChange={(e) => setFormData({...formData, nome_evento: e.target.value})}
                  placeholder="Ex: Congresso Internacional de Medicina 2025"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="data_inicio">Data de Início</Label>
                  <Input
                    id="data_inicio"
                    type="date"
                    value={formData.data_inicio_evento}
                    onChange={(e) => setFormData({...formData, data_inicio_evento: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="data_fim">Data de Término</Label>
                  <Input
                    id="data_fim"
                    type="date"
                    value={formData.data_fim_evento}
                    onChange={(e) => setFormData({...formData, data_fim_evento: e.target.value})}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="tipo_evento">Tipo de Evento</Label>
                  <Select
                    value={formData.tipo_evento}
                    onValueChange={(value) => setFormData({...formData, tipo_evento: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="congresso">Congresso</SelectItem>
                      <SelectItem value="simposio">Simpósio</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="academico">Acadêmico</SelectItem>
                      <SelectItem value="corporativo">Corporativo</SelectItem>
                      <SelectItem value="gratuito">Gratuito</SelectItem>
                      <SelectItem value="outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="url_evento">URL do Site do Evento</Label>
                  <Input
                    id="url_evento"
                    type="url"
                    placeholder="https://"
                    value={formData.url_evento}
                    onChange={(e) => setFormData({...formData, url_evento: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/organizador/eventos')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Evento'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CriarEvento;
