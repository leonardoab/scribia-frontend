import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const CadastroOrganizador = () => {
  const navigate = useNavigate();
  const { user } = useCustomAuth();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome: user?.profile.nome_completo || '',
    email: user?.profile.email || '',
    organizacao: '',
    cargo: '',
    telefone: user?.profile.whatsapp || '',
    nome_evento: '',
    data_inicio_evento: '',
    data_fim_evento: '',
    tipo_evento: '',
    url_evento: '',
    logo_url: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: orgData, error: orgError } = await supabase
        .from('scribia_organizadores' as any)
        .insert({
          user_id: user!.profile.id,
          nome: formData.nome,
          email: formData.email,
          organizacao: formData.organizacao || null,
          cargo: formData.cargo || null,
          telefone: formData.telefone || null
        })
        .select()
        .single();

      if (orgError) throw orgError;

      await supabase.rpc('assign_organizador_role' as any, {
        p_user_id: user!.profile.id
      });

      const { data: eventoData, error: eventoError } = await supabase
        .from('scribia_eventos')
        .insert({
          organizador_id: (orgData as any).id,
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

      toast.success('Cadastro de organizador concluído com sucesso!');
      navigate(`/organizador/dashboard/${eventoData.id}`);
    } catch (error: any) {
      console.error('Erro ao criar organizador:', error);
      toast.error('Erro ao concluir cadastro. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-12 px-4">
      <Card className="max-w-3xl mx-auto">
        <CardHeader>
          <CardTitle>Cadastro de Organizador ScribIA</CardTitle>
          <CardDescription>
            Complete seu cadastro para acessar o Dashboard do Organizador
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    required
                    value={formData.nome}
                    onChange={(e) => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="organizacao">Organização/Empresa</Label>
                  <Input
                    id="organizacao"
                    value={formData.organizacao}
                    onChange={(e) => setFormData({...formData, organizacao: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="cargo">Cargo</Label>
                  <Input
                    id="cargo"
                    value={formData.cargo}
                    onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData({...formData, telefone: e.target.value})}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Dados do Evento Principal</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <Label htmlFor="nome_evento">Nome do Evento *</Label>
                  <Input
                    id="nome_evento"
                    required
                    value={formData.nome_evento}
                    onChange={(e) => setFormData({...formData, nome_evento: e.target.value})}
                  />
                </div>
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
                onClick={() => navigate('/')}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Criando...' : 'Criar Conta de Organizador'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default CadastroOrganizador;
