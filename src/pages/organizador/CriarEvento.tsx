import { getApiBaseUrl } from '@/services/api';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
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
    formato_evento: '',
    tipo_evento: '',
    cidade: '',
    estado: '',
    pais: '',
    url_evento: '',
    logo_url: ''
  });

  useEffect(() => {
    if (user?.profile?.id) {
      setOrganizadorId(user.profile.id);
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organizadorId) return;

    setLoading(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/eventos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          nome_evento: formData.nome_evento,
          data_inicio: formData.data_inicio_evento || null,
          data_fim: formData.data_fim_evento || null,
          formato_evento: formData.formato_evento || null,
          cidade: formData.cidade || null,
          estado: formData.estado || null,
          pais: formData.pais || null,
          tipo_evento: formData.tipo_evento || null,
          url_evento: formData.url_evento || null,
          logo_url: formData.logo_url || null,
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Erro ao criar evento');
      }

      const responseData = await response.json();
      const evento = responseData.data || responseData;

      toast.success('Evento criado com sucesso!');
      navigate('/organizador/eventos');
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

              <div>
                <Label>Formato do Evento *</Label>
                <div className="flex gap-4 mt-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formato_evento"
                      value="presencial"
                      checked={formData.formato_evento === 'presencial'}
                      onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                      className="w-4 h-4"
                    />
                    <span>Presencial</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formato_evento"
                      value="remoto"
                      checked={formData.formato_evento === 'remoto'}
                      onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                      className="w-4 h-4"
                    />
                    <span>Remoto</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="formato_evento"
                      value="hibrido"
                      checked={formData.formato_evento === 'hibrido'}
                      onChange={(e) => setFormData({...formData, formato_evento: e.target.value})}
                      className="w-4 h-4"
                    />
                    <span>Híbrido</span>
                  </label>
                </div>
              </div>

              {(formData.formato_evento === 'presencial' || formData.formato_evento === 'hibrido') && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData({...formData, cidade: e.target.value})}
                      placeholder="Ex: São Paulo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData({...formData, estado: e.target.value})}
                      placeholder="Ex: SP"
                    />
                  </div>
                  <div>
                    <Label htmlFor="pais">País</Label>
                    <Input
                      id="pais"
                      value={formData.pais}
                      onChange={(e) => setFormData({...formData, pais: e.target.value})}
                      placeholder="Ex: Brasil"
                    />
                  </div>
                </div>
              )}

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
