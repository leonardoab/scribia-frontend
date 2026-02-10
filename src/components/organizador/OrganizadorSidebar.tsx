import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  Users, 
  FileText, 
  TrendingUp, 
  BarChart3, 
  Settings,
  BookOpen, 
  HelpCircle, 
  LogOut,
  Brain,
  MessageCircle
} from 'lucide-react';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface OrganizadorSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const OrganizadorSidebar = ({ className, onNavigate }: OrganizadorSidebarProps) => {
  const { logout } = useCustomAuth();
  const location = useLocation();

  const menuItems = [
    { 
      path: '/organizador', 
      icon: Home, 
      label: 'Início',
      description: 'Resumo Geral'
    },
    { 
      path: '/organizador/eventos', 
      icon: Calendar, 
      label: 'Meus Eventos',
      description: 'Gerenciar eventos'
    },
    { 
      path: '/organizador/livebooks', 
      icon: BookOpen, 
      label: 'Meus Livebooks',
      description: 'Materiais de estudo'
    },
    { 
      path: '/organizador/participantes', 
      icon: Users, 
      label: 'Participantes',
      description: 'Visualizar inscritos'
    },
    { 
      path: '/organizador/palestras-livebooks', 
      icon: FileText, 
      label: 'Palestras e Livebooks',
      description: 'Conteúdo e desempenho'
    },
    { 
      path: '/organizador/rankings', 
      icon: TrendingUp, 
      label: 'Rankings e Tendências',
      description: 'Análises avançadas'
    },
    { 
      path: '/organizador/relatorios', 
      icon: BarChart3, 
      label: 'Relatórios Executivos',
      description: 'Insights detalhados'
    },
    { 
      path: '/organizador/configuracoes', 
      icon: Settings, 
      label: 'Configurações',
      description: 'Perfil e preferências'
    }
  ];

  const isActive = (path: string) => {
    if (path === '/organizador') {
      return location.pathname === '/organizador';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <aside className={cn("w-64 bg-gradient-to-b from-purple-900 via-purple-800 to-blue-900 text-white shadow-xl h-full", className)}>
      <div className="flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 border-b border-purple-700/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Brain className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold">ScribIA Plus</h1>
              <p className="text-purple-200 text-sm">Organizador</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={handleNavigation}
                className={`
                  flex items-center gap-3 p-3 rounded-lg transition-all duration-200 group
                  ${active 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-purple-100 hover:bg-white/10 hover:text-white'
                  }
                `}
              >
                <Icon className={`h-5 w-5 ${active ? 'text-white' : 'text-purple-300 group-hover:text-white'}`} />
                <div className="flex-1">
                  <div className={`font-medium ${active ? 'text-white' : 'text-purple-100 group-hover:text-white'}`}>
                    {item.label}
                  </div>
                  <div className={`text-xs ${active ? 'text-purple-100' : 'text-purple-300 group-hover:text-purple-200'}`}>
                    {item.description}
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Support Section */}
        <div className="p-4 border-t border-purple-700/50">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-purple-100 hover:bg-white/10 hover:text-white"
          >
            <MessageCircle className="h-4 w-4 mr-3" />
            Contatar Suporte
          </Button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-purple-700/50">
          <Button 
            onClick={logout}
            variant="ghost" 
            className="w-full justify-start text-purple-100 hover:bg-red-500/20 hover:text-red-200"
          >
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </div>
    </aside>
  );
};

export default OrganizadorSidebar;