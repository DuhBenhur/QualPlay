import React from 'react';
import { Film, Info, MessageSquare, Home, HelpCircle, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import UserMenu from './Auth/UserMenu';
// import LanguageSelector from './LanguageSelector';

interface NavigationProps {
  currentPage: 'home' | 'about' | 'contact';
  onPageChange: (page: 'home' | 'about' | 'contact') => void;
  onOpenTutorial?: () => void;
  onLogin?: () => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentPage, 
  onPageChange, 
  onOpenTutorial,
  onLogin
}) => {
  const { user } = useAuth();
  
  const [showLoginModal, setShowLoginModal] = React.useState(false);

  const navItems = [
    { id: 'home' as const, label: 'Buscar Filmes', icon: Home },
    { id: 'about' as const, label: 'Sobre', icon: Info },
    { id: 'contact' as const, label: 'Contato', icon: MessageSquare },
  ];

  return (
    <nav className="bg-slate-800 border-b border-slate-700">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="/seu_logo.png" 
              alt="Eduardo Ben-Hur Logo" 
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex items-center gap-3">
              <Film className="text-blue-400" size={28} />
              <span className="text-xl font-bold text-white">QualPlay</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-1 gap-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onPageChange(item.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                    currentPage === item.id
                      ? 'bg-blue-600 text-white'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700'
                  }`}
                >
                  <Icon size={18} />
                  <span className="hidden sm:inline">{item.label}</span>
                </button>
              );
            })}
            
            {/* <LanguageSelector /> */}
            
            {onOpenTutorial && (
              <button
                onClick={onOpenTutorial}
                className="flex items-center gap-2 px-4 py-2 rounded-md transition-colors text-slate-300 hover:text-white hover:bg-slate-700"
                title="Abrir tutorial"
              >
                <HelpCircle size={18} />
                <span className="hidden sm:inline">Tutorial</span>
              </button>
            )}
            
            {user ? (
              <UserMenu />
            ) : (
              <button
                onClick={onLogin}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <LogIn size={18} />
                <span className="hidden sm:inline">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;