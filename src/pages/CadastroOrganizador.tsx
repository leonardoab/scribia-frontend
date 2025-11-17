import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';

const CadastroOrganizador = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '',
    email: '',
    senha: '',
    confirmar_senha: '',
    whatsapp: '',
    organizacao: '',
    cargo: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.senha !== formData.confirmar_senha) {
      toast.error('As senhas não coincidem');
      return;
    }

    if (formData.senha.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // 1. Criar usuário usando função RPC de signup
      const { data: signupData, error: signupError } = await supabase.rpc('scribia_signup', {
        p_nome_completo: formData.nome_completo,
        p_email: formData.email,
        p_senha: formData.senha,
        p_cpf: null,
        p_whatsapp: formData.whatsapp || null,
      });

      if (signupError) throw signupError;

      const responseData = typeof signupData === 'string' ? JSON.parse(signupData) : signupData;

      if (!responseData.success) {
        throw new Error(responseData.mensagem || 'Erro ao criar conta');
      }

      const userId = responseData.usuario_id;

      // 2. Atribuir role de organizador
      const { error: roleError } = await supabase.rpc('assign_organizador_role' as any, {
        p_user_id: userId
      });

      if (roleError) throw roleError;

      // 3. Criar configuração do organizador
      const { error: configError } = await supabase
        .from('scribia_configuracoes_organizador')
        .insert({
          usuario_id: userId,
          nome_organizacao: formData.organizacao || null,
          cargo: formData.cargo || null,
        });

      if (configError) throw configError;

      toast.success('Conta de organizador criada com sucesso!');
      toast.info('Faça login para acessar o dashboard');
      
      navigate('/login');
    } catch (error: any) {
      console.error('Erro ao criar organizador:', error);
      toast.error(error.message || 'Erro ao criar conta. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Cadastro de Organizador - ScribIA</title>
        <meta name="description" content="Crie sua conta de organizador no ScribIA" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-purple-50 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => navigate('/organizadores')}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Cadastro de Organizador</CardTitle>
              <CardDescription>
                Complete seu cadastro para começar a usar o ScribIA na organização de seus eventos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Dados Pessoais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Pessoais</h3>
                  
                  <div>
                    <Label htmlFor="nome_completo">Nome Completo *</Label>
                    <Input
                      id="nome_completo"
                      required
                      value={formData.nome_completo}
                      onChange={(e) => setFormData({...formData, nome_completo: e.target.value})}
                      placeholder="Seu nome completo"
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
                      placeholder="seu@email.com"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whatsapp">WhatsApp</Label>
                    <Input
                      id="whatsapp"
                      type="tel"
                      value={formData.whatsapp}
                      onChange={(e) => setFormData({...formData, whatsapp: e.target.value})}
                      placeholder="(00) 00000-0000"
                    />
                  </div>

                  <div>
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      required
                      value={formData.senha}
                      onChange={(e) => setFormData({...formData, senha: e.target.value})}
                      placeholder="Mínimo 6 caracteres"
                    />
                  </div>

                  <div>
                    <Label htmlFor="confirmar_senha">Confirmar Senha *</Label>
                    <Input
                      id="confirmar_senha"
                      type="password"
                      required
                      value={formData.confirmar_senha}
                      onChange={(e) => setFormData({...formData, confirmar_senha: e.target.value})}
                      placeholder="Repita sua senha"
                    />
                  </div>
                </div>

                {/* Dados Profissionais */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Dados Profissionais</h3>
                  
                  <div>
                    <Label htmlFor="organizacao">Organização</Label>
                    <Input
                      id="organizacao"
                      value={formData.organizacao}
                      onChange={(e) => setFormData({...formData, organizacao: e.target.value})}
                      placeholder="Nome da empresa ou organização"
                    />
                  </div>

                  <div>
                    <Label htmlFor="cargo">Cargo</Label>
                    <Input
                      id="cargo"
                      value={formData.cargo}
                      onChange={(e) => setFormData({...formData, cargo: e.target.value})}
                      placeholder="Seu cargo na organização"
                    />
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/organizadores')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    {loading ? 'Criando conta...' : 'Criar Conta'}
                  </Button>
                </div>

                <p className="text-sm text-center text-muted-foreground">
                  Já tem uma conta?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    className="text-primary hover:underline"
                  >
                    Faça login
                  </button>
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default CadastroOrganizador;
