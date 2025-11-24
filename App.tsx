
import React, { useState, useEffect } from 'react';
import { View, UserType } from './types';
// BottomNav removido para limpar a interface
import Dashboard from './components/Dashboard';
import WalletView from './components/Wallet';
import PerformanceView from './components/Performance';
import Onboarding from './components/Onboarding';
import Stores from './components/Stores';
import StorePanel from './components/StorePanel';
import Profile from './components/Profile';
import AdminPanel from './components/AdminPanel';
import Sidebar from './components/Sidebar';
import SplashScreen from './components/SplashScreen';

const App: React.FC = () => {
  const [userType, setUserType] = useState<UserType>(null);
  const [currentView, setView] = useState<View>(View.HOME);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Simula tempo de carregamento da Splash Screen
    const timer = setTimeout(() => {
      // Verifica se há um usuário salvo
      const savedUserType = localStorage.getItem('neo_user_type') as UserType;
      if (savedUserType) {
        setUserType(savedUserType);
      }
      setShowSplash(false);
    }, 2500); // 2.5 segundos de splash

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = (type: UserType) => {
    localStorage.setItem('neo_user_type', type || '');
    setUserType(type);
  };

  const handleLogout = () => {
    localStorage.removeItem('neo_user_type');
    setUserType(null);
    setView(View.HOME);
  };

  if (showSplash) {
    return <SplashScreen />;
  }

  // Se não houver tipo de usuário definido, mostra o Onboarding
  if (!userType) {
    return <Onboarding onLogin={handleLogin} />;
  }

  // SE FOR ADMIN: Mostra Painel Administrativo
  if (userType === 'admin') {
    return <AdminPanel onLogout={handleLogout} />;
  }

  // SE FOR LOJA: Mostra apenas o Painel da Loja
  if (userType === 'store') {
    return <StorePanel onLogout={handleLogout} />;
  }

  // Handler para abrir o sidebar
  const handleOpenSidebar = () => setIsSidebarOpen(true);

  // Handler para voltar ao Início (Mapa)
  const handleBackToHome = () => setView(View.HOME);

  // SE FOR MOTORISTA: Mostra o App do Entregador
  const renderDriverView = () => {
    switch (currentView) {
      case View.HOME:
        return <Dashboard onOpenSidebar={handleOpenSidebar} onNavigate={(view) => setView(view)} />;
      case View.STORES:
        return <Stores onBack={handleBackToHome} />;
      case View.WALLET:
        return <WalletView onBack={handleBackToHome} />;
      case View.PERFORMANCE:
        return <PerformanceView onBack={handleBackToHome} />;
      case View.PROFILE:
        return <Profile onLogout={handleLogout} onBack={handleBackToHome} />;
      default:
        return <Dashboard onOpenSidebar={handleOpenSidebar} onNavigate={(view) => setView(view)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative">
        
        {/* Sidebar Component - Central de Navegação */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          onNavigate={(view) => setView(view)}
          onLogout={handleLogout}
        />

        {renderDriverView()}
        
        {/* BottomNav removido conforme solicitado para limpar o mapa */}
      </div>
      
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default App;
