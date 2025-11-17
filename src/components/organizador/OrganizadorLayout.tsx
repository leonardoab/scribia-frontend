import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import OrganizadorSidebar from './OrganizadorSidebar';
import OrganizadorHeader from './OrganizadorHeader';
import TutorOrganizadorModal from './TutorOrganizadorModal';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import OrganizadorDashboard from '@/pages/organizador/OrganizadorDashboard';

// Importar páginas do organizador
import MeusEventos from '@/pages/organizador/MeusEventos';
import Participantes from '@/pages/organizador/Participantes';
import PalestrasLivebooks from '@/pages/organizador/PalestrasLivebooks';
import RankingsTendencias from '@/pages/organizador/RankingsTendencias';
import RelatoriosExecutivos from '@/pages/organizador/RelatoriosExecutivos';
import ConfiguracoesOrganizador from '@/pages/organizador/ConfiguracoesOrganizador';

const OrganizadorLayout = () => {
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { loading } = useCustomAuth();
  const isMobile = useIsMobile();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <div className="fixed left-0 top-0 h-screen z-40">
          <OrganizadorSidebar />
        </div>
      )}

      {/* Mobile Menu */}
      {isMobile && (
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon"
              className="fixed top-3 left-3 z-50 md:hidden text-white"
            >
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <OrganizadorSidebar onNavigate={() => setIsMobileMenuOpen(false)} />
          </SheetContent>
        </Sheet>
      )}
      
      <OrganizadorHeader 
        onOpenTutor={() => setIsTutorOpen(true)}
        isMobile={isMobile}
      />
      
      <main className={`${isMobile ? 'ml-0' : 'ml-64'} pt-16 min-h-screen`}>
        <div className="p-4 md:p-6">
          <Routes>
            <Route index element={<MeusEventos />} />
            <Route path="dashboard/:eventoId" element={<OrganizadorDashboard />} />
            <Route path="eventos" element={<MeusEventos />} />
            <Route path="participantes" element={<Participantes />} />
            <Route path="palestras-livebooks" element={<PalestrasLivebooks />} />
            <Route path="rankings" element={<RankingsTendencias />} />
            <Route path="relatorios" element={<RelatoriosExecutivos />} />
            <Route path="configuracoes" element={<ConfiguracoesOrganizador />} />
          </Routes>
        </div>
      </main>

      <TutorOrganizadorModal 
        isOpen={isTutorOpen} 
        onClose={() => setIsTutorOpen(false)} 
      />
    </div>
  );
};

export default OrganizadorLayout;