import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import DashboardHome from '@/pages/dashboard/Dashboard';
import EventosDashboard from '@/pages/dashboard/EventosDashboard';
import Livebooks from '@/pages/dashboard/Livebooks';
import LivebookView from '@/pages/dashboard/LivebookView';
import Bia from '@/pages/dashboard/Bia';
import Tutor from '@/pages/dashboard/Tutor';
import GerarLivebook from '@/pages/dashboard/GerarLivebook';
import Ajuda from '@/pages/dashboard/Ajuda';
import Configuracoes from '@/pages/dashboard/Configuracoes';
import PalestrasList from '@/pages/palestras/PalestrasList';
import PalestraForm from '@/pages/palestras/PalestraForm';
import PalestraDetalhe from '@/pages/palestras/PalestraDetalhe';
import LivebooksList from '@/pages/livebooks/LivebooksList';
import LivebookForm from '@/pages/livebooks/LivebookForm';
import LivebookDetalhe from '@/pages/livebooks/LivebookDetalhe';

const DashboardLayout = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, loading } = useCustomAuth();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const location = useLocation();

  // Verificar se o perfil foi definido
  useEffect(() => {
    // Criar variável separada para melhorar detecção de mudanças
    const perfilDefinido = user?.profile?.perfil_definido;
    
    if (!loading && user && perfilDefinido === false) {
      console.log('🔄 Redirecionando para definir perfil');
      navigate('/definir-perfil', { replace: true });
    }
  }, [loading, user, user?.profile, user?.profile?.perfil_definido, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar - sempre renderizada, oculta em mobile */}
      <aside className="hidden lg:block fixed left-0 top-0 h-screen z-30">
        <Sidebar />
      </aside>

      {/* Mobile Menu */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="fixed top-3 left-3 z-50 lg:hidden"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <Sidebar onNavigate={() => setIsMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>
      
      <Header isMobile={isMobile} />
      
      <main className="lg:ml-64 pt-14 md:pt-16 min-h-screen">
        <div className="w-full">
          <Routes>
            <Route index element={<DashboardHome />} />
            <Route path="eventos" element={<EventosDashboard />} />
            <Route path="palestras" element={<PalestrasList />} />
            <Route path="eventos/:eventoId/palestras" element={<PalestrasList />} />
            <Route path="eventos/:eventoId/palestras/nova" element={<PalestraForm />} />
            <Route path="eventos/:eventoId/palestras/:palestraId" element={<PalestraDetalhe />} />
            <Route path="eventos/:eventoId/palestras/:palestraId/editar" element={<PalestraForm />} />
            <Route path="palestras/:palestraId/livebooks/novo" element={<LivebookForm />} />
            <Route path="gerar-livebook" element={<GerarLivebook />} />
            <Route path="bia" element={<Bia />} />
            <Route path="tutor" element={<Tutor />} />
            <Route path="livebooks" element={<Livebooks />} />
            <Route path="livebooks/:id" element={<LivebookView />} />
            <Route path="livebooks/:livebookId" element={<LivebookDetalhe />} />
            <Route path="ajuda" element={<Ajuda />} />
            <Route path="configuracoes" element={<Configuracoes />} />
          </Routes>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;