import React from 'react';
import { Home, Wallet, Trophy, User, Store } from 'lucide-react';
import { View } from '../types';

interface BottomNavProps {
  currentView: View;
  setView: (view: View) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentView, setView }) => {
  const navItems = [
    { id: View.HOME, icon: Home, label: 'Início' },
    { id: View.STORES, icon: Store, label: 'Lojas' },
    { id: View.WALLET, icon: Wallet, label: 'Carteira' }, // Label menor para caber
    { id: View.PERFORMANCE, icon: Trophy, label: 'Score' },
    { id: View.PROFILE, icon: User, label: 'Perfil' },
  ];

  return (
    <div className="fixed bottom-6 left-4 right-4 z-50 flex justify-center">
      <div className="bg-gray-900/90 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-white/10 px-6 py-3 w-full max-w-sm flex justify-between items-center transition-all duration-300 hover:scale-[1.01]">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`relative flex flex-col items-center justify-center w-12 h-12 transition-all duration-300 group`}
            >
              {/* Active Indicator Background */}
              {isActive && (
                <div className="absolute inset-0 bg-white/10 rounded-xl blur-sm animate-pulse"></div>
              )}
              
              <div className={`relative z-10 transition-transform duration-300 ${isActive ? 'transform -translate-y-1 scale-110' : 'group-hover:scale-105'}`}>
                <item.icon 
                  size={isActive ? 24 : 22} 
                  strokeWidth={isActive ? 2.5 : 1.5}
                  className={`transition-colors duration-300 ${isActive ? 'text-[#EA1D2C]' : 'text-gray-400 group-hover:text-gray-200'}`} 
                />
              </div>
              
              {isActive && (
                <span className="absolute -bottom-1 text-[9px] font-bold text-white animate-fade-in">
                  {item.label}
                </span>
              )}
              
              {!isActive && (
                 <div className="absolute bottom-0 w-1 h-1 bg-gray-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;