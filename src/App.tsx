import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/dashboard/DashboardLayout";
import OrganizadorLayout from "./components/organizador/OrganizadorLayout";
import Navbar from "./components/sections/Navbar";
import { AuthGuard } from "./components/auth/AuthGuard";
import { HelmetProvider } from "react-helmet-async";
import { ThemeProvider } from "./components/ThemeProvider";
import { TranslationProvider } from "./i18n/TranslationContext";

// Lazy load pages for better performance
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const TesteGratuito = lazy(() => import("./pages/TesteGratuito"));
const Login = lazy(() => import("./pages/Login"));
const Cadastro = lazy(() => import("./pages/Cadastro"));
const EsqueciSenha = lazy(() => import("./pages/EsqueciSenha"));
const RedefinirSenha = lazy(() => import("./pages/RedefinirSenha"));
const VerificarEmail = lazy(() => import("./pages/VerificarEmail"));
const SelecionarTipoConta = lazy(() => import("./pages/SelecionarTipoConta"));
const DefinirPerfil = lazy(() => import("./pages/DefinirPerfil"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const DashboardHome = lazy(() => import("./pages/dashboard/Dashboard"));
const Events = lazy(() => import("./pages/dashboard/Events"));
const Livebooks = lazy(() => import("./pages/dashboard/Livebooks"));
const EventosDashboard = lazy(() => import("./pages/dashboard/EventosDashboard"));
const PatrocinadorDashboard = lazy(() => import("./pages/dashboard/PatrocinadorDashboard"));
const PalestranteDashboard = lazy(() => import("./pages/dashboard/PalestranteDashboard"));
const PalestrasList = lazy(() => import("./pages/palestras/PalestrasList"));
const PalestraForm = lazy(() => import("./pages/palestras/PalestraForm"));
const PalestraDetalhe = lazy(() => import("./pages/palestras/PalestraDetalhe"));
const LivebooksList = lazy(() => import("./pages/livebooks/LivebooksList"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const ParticipantesLanding = lazy(() => import("./pages/ParticipantesLanding"));
const SelecionarPlano = lazy(() => import("./pages/SelecionarPlano"));
const OrganizadoresLanding = lazy(() => import("./pages/OrganizadoresLanding"));
const PalestrantesLanding = lazy(() => import("./pages/PalestrantesLanding"));
const PatrocinadoresLanding = lazy(() => import("./pages/PatrocinadoresLanding"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen bg-background">
    <div className="text-center space-y-4">
      <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
      <p className="text-sm text-muted-foreground">Carregando...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TranslationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={
                    <>
                      <Navbar />
                      <Index />
                    </>
                  } />
                  <Route path="/teste-gratuito" element={<TesteGratuito />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/cadastro" element={<Cadastro />} />
                  <Route path="/esqueci-senha" element={<EsqueciSenha />} />
                  <Route path="/redefinir-senha" element={<RedefinirSenha />} />
                  <Route path="/verificar-email" element={<VerificarEmail />} />
                  <Route path="/selecionar-tipo-conta" element={
                    <AuthGuard>
                      <SelecionarTipoConta />
                    </AuthGuard>
                  } />
                  <Route path="/definir-perfil" element={
                    <AuthGuard>
                      <DefinirPerfil />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard/*" element={
                    <AuthGuard>
                      <DashboardLayout />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard-old" element={
                    <AuthGuard>
                      <Dashboard />
                    </AuthGuard>
                  } />
                  <Route path="/organizador/*" element={
                    <AuthGuard>
                      <OrganizadorLayout />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard/patrocinador" element={
                    <AuthGuard>
                      <PatrocinadorDashboard />
                    </AuthGuard>
                  } />
                  <Route path="/dashboard/palestrante" element={
                    <AuthGuard>
                      <PalestranteDashboard />
                    </AuthGuard>
                  } />
                  <Route path="/participantes" element={
                    <>
                      <Navbar />
                      <ParticipantesLanding />
                    </>
                  } />
                  <Route path="/organizadores" element={
                    <>
                      <Navbar />
                      <OrganizadoresLanding />
                    </>
                  } />
                  <Route path="/palestrantes" element={
                    <>
                      <Navbar />
                      <PalestrantesLanding />
                    </>
                  } />
                  <Route path="/influenciadores" element={
                    <>
                      <Navbar />
                      <PalestrantesLanding />
                    </>
                  } />
                  <Route path="/patrocinadores" element={
                    <>
                      <Navbar />
                      <PatrocinadoresLanding />
                    </>
                  } />
                  <Route path="/selecionar-plano" element={
                    <>
                      <Navbar />
                      <SelecionarPlano />
                    </>
                  } />
                  <Route path="/admin" element={
                    <AuthGuard>
                      <AdminDashboard />
                    </AuthGuard>
                  } />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
