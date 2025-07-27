import React, { useState } from 'react'
import { User, Settings, LogOut, BarChart3, Heart, List } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

const UserMenu: React.FC = () => {
  const { user, profile, signOut } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split('@')[0] || 'Usuário';
  const avatarUrl = profile?.avatar_url;

  const handleSignOut = async () => {
    try {
      // Limpar localStorage
      localStorage.clear();
      
      // Tentar logout do Supabase (sem esperar)
      supabase.auth.signOut().catch(() => {});
      
      // Fechar menu
      setIsOpen(false);
      
      // Forçar logout imediatamente
      window.location.href = '/';
      
    } catch (error) {
      // Mesmo com erro, forçar logout
      localStorage.clear();
      window.location.href = '/';
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white transition-colors rounded-md hover:bg-slate-700"
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={displayName}
            className="w-8 h-8 rounded-full object-cover"
          />
        ) : (
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
        )}
        <span className="hidden sm:inline text-sm">
          {displayName}
        </span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={(e) => {
              console.log('Overlay clicado - fechando menu');
              setIsOpen(false);
            }}
          />
          <div 
            className="absolute right-0 top-full mt-1 w-64 bg-slate-800 border border-slate-700 rounded-md shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation();
              console.log('Menu clicado - mantendo aberto');
            }}
          >
            {/* User Info */}
            <div className="p-4 border-b border-slate-700">
              <div className="flex items-center gap-3">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center">
                    <User size={20} className="text-white" />
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">
                    {displayName}
                  </p>
                  <p className="text-slate-400 text-sm">{user.email}</p>
                </div>
              </div>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <Heart size={16} />
                <span>Minhas Listas</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <BarChart3 size={16} />
                <span>Meu Perfil de Gostos</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <List size={16} />
                <span>Histórico</span>
              </button>
              
              <button className="w-full flex items-center gap-3 px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors">
                <Settings size={16} />
                <span>Configurações</span>
              </button>
            </div>

            {/* Sign Out */}
            <div className="border-t border-slate-700 py-2">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Botão Sair clicado - evento capturado');
                  handleSignOut();
                }}
                className="w-full flex items-center gap-3 px-4 py-2 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
              >
                <LogOut size={16} />
                <span>Sair</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default UserMenu