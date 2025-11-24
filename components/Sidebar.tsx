
import React from 'react';
import { 
  X, 
  Home, 
  Wallet, 
  Store, 
  Trophy, 
  LogOut, 
  ChevronRight, 
  User,
  Star,
  Settings
} from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (view: View) => void;
  onLogout: () => void;
  userData?: {
    name: string;
    rating: number;
    level: string;
  };
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, onNavigate, onLogout, userData }) => {
  // Dados padrão caso não sejam passados
  const user = userData || {
    name: 'Carlos Silva',
    rating: 4.95,
    level: 'Ouro'
  };

  const menuItems = [
    { label: 'Início', icon: Home, view: View.HOME },
    { label: 'Lojas Parceiras', icon: Store, view: View.STORES },
    { label: 'Minha Carteira', icon: Wallet, view: View.WALLET },
    { label: 'Score e Nível', icon: Trophy, view: View.PERFORMANCE },
    { label: 'Meu Perfil', icon: Settings, view: View.PROFILE },
  ];

  const handleNavigation = (view: View) => {
    onNavigate(view);
    onClose();
  };

  return (
    <>
      {/* Overlay (Fundo escuro) */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed top-0 left-0 h-full w-[85%] max-w-[320px] bg-white z-[70] shadow-2xl transform transition-transform duration-300 ease-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Header do Menu */}
        <div className="bg-gray-900 text-white p-6 pt-12 relative overflow-hidden">
           {/* Botão Fechar */}
           <button 
             onClick={onClose}
             className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
           >
             <X size={24} />
           </button>

           <div className="flex items-center gap-4 relative z-10">
              <div className="w-16 h-16 rounded-full bg-gray-800 border-2 border-white shadow-md flex items-center justify-center overflow-hidden">
                 <User size={32} className="text-gray-400" />
              </div>
              <div>
                 <h2 className="font-bold text-xl leading-tight">{user.name}</h2>
                 <div className="flex items-center gap-1 mt-1 text-sm text-gray-300">
                    <Star size={12} className="text-yellow-400 fill-current" />
                    <span className="font-medium">{user.rating}</span>
                    <span className="text-gray-600 mx-1">•</span>
                    <span className="text-yellow-400 font-bold uppercase text-xs">{user.level}</span>
                 </div>
              </div>
           </div>
           
           {/* Link ver perfil */}
           <button 
             onClick={() => handleNavigation(View.PROFILE)}
             className="mt-4 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
           >
             Editar dados <ChevronRight size={12} />
           </button>

           {/* Decorative circles */}
           <div className="absolute -right-4 -bottom-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
        </div>

        {/* Lista de Navegação */}
        <div className="flex-1 overflow-y-auto py-4">
           <ul className="space-y-1 px-3">
              {menuItems.map((item, index) => (
                 <li key={index}>
                    <button 
                      onClick={() => handleNavigation(item.view)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl text-gray-700 hover:bg-gray-50 active:bg-gray-100 transition-all group"
                    >
                       <div className="p-2 bg-gray-50 rounded-lg group-hover:bg-gray-200 transition-colors">
                          <item.icon size={20} className="text-gray-500 group-hover:text-gray-900 transition-colors" />
                       </div>
                       <span className="font-medium text-base">{item.label}</span>
                       <ChevronRight size={16} className="ml-auto text-gray-300 group-hover:text-gray-500" />
                    </button>
                 </li>
              ))}
           </ul>
        </div>

        {/* Footer / Logout */}
        <div className="p-4 border-t border-gray-100 pb-8">
           <button 
             onClick={onLogout}
             className="w-full flex items-center gap-4 p-4 rounded-xl text-red-600 hover:bg-red-50 transition-all group"
           >
              <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                <LogOut size={20} className="text-red-500" />
              </div>
              <span className="font-bold">Sair da conta</span>
           </button>
           <p className="text-center text-[10px] text-gray-300 mt-2">Versão 3.0.0 (Neo)</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
