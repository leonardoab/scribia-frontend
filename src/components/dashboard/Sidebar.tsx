import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  Calendar, 
  BookOpen, 
  HelpCircle, 
  LogOut,
  Settings,
  Brain,
  FileText,
  Mic
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCustomAuth } from '@/hooks/useCustomAuth';
import { cn } from '@/lib/utils';

interface SidebarProps {
  className?: string;
  onNavigate?: () => void;
}

const Sidebar = ({ className, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { logout } = useCustomAuth();

  const menuItems = [
    { icon: Home, label: 'Início', path: '/dashboard' },
    { icon: Calendar, label: 'Meus Eventos', path: '/dashboard/eventos' },
    { icon: BookOpen, label: 'Gerar Livebook', path: '/dashboard/gerar-livebook' },
    { icon: BookOpen, label: 'Meus Livebooks', path: '/dashboard/livebooks' },
    { icon: FileText, label: 'Tutor ScribIA', path: '/dashboard/tutor' },
    { icon: HelpCircle, label: 'Ajuda / Suporte', path: '/dashboard/ajuda' },
  ];

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = () => {
    if (onNavigate) onNavigate();
  };

  return (
    <div className={cn("w-64 bg-card border-r border-border h-full flex flex-col", className)}>
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">ScribIA</h1>
            <p className="text-sm text-purple-600 font-medium">Plus</p>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleNavigation}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-border space-y-2">
        <Link
          to="/dashboard/configuracoes"
          onClick={handleNavigation}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
          <span className="font-medium">Configurações</span>
        </Link>
        
        <Button
          onClick={logout}
          variant="ghost"
          className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Sair
        </Button>
      </div>
    </div>
  );
};

export default Sidebar;