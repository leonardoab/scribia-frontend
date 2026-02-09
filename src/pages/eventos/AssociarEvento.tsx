import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { eventosApi } from '@/services/api';
import { useCustomAuth } from '@/hooks/useCustomAuth';

const AssociarEvento = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useCustomAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  const [eventoNome, setEventoNome] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      localStorage.setItem('redirect_after_login', `/eventos/participar/${token}`);
      navigate('/login');
      return;
    }

    associarEvento();
  }, [user, authLoading, token]);

  const associarEvento = async () => {
    try {
      const response = await eventosApi.associar(token!);
      const data = response.data.data || response.data;
      setStatus('success');
      setMessage(data.message);
      setEventoNome(data.evento.nome);
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Erro ao associar ao evento');
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Processando...</h2>
            <p className="text-muted-foreground">Associando você ao evento</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-center text-2xl">Sucesso!</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">{message}</p>
            <p className="font-semibold text-lg">{eventoNome}</p>
            <div className="flex gap-3 pt-4">
              <Button 
                className="flex-1 bg-purple-600 hover:bg-purple-700"
                onClick={() => navigate('/dashboard/eventos')}
              >
                Ver Meus Eventos
              </Button>
              <Button 
                variant="outline"
                className="flex-1"
                onClick={() => navigate('/dashboard')}
              >
                Ir para Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 to-blue-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-10 h-10 text-red-600" />
            </div>
          </div>
          <CardTitle className="text-center text-2xl">Erro</CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <p className="text-muted-foreground">{message}</p>
          <div className="flex gap-3 pt-4">
            <Button 
              className="flex-1"
              onClick={() => navigate('/dashboard')}
            >
              Voltar ao Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AssociarEvento;
