
import React from 'react';
import { Zap } from 'lucide-react';

const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col items-center justify-center text-white overflow-hidden font-sans">
      {/* Background Effects */}
      <div className="absolute inset-0 pointer-events-none">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[#EA1D2C] rounded-full blur-[150px] opacity-20 animate-pulse"></div>
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
      </div>

      <div className="relative z-10 flex flex-col items-center animate-fade-in-up">
        <div className="w-24 h-24 bg-gradient-to-br from-[#EA1D2C] to-orange-600 rounded-3xl flex items-center justify-center shadow-[0_0_60px_rgba(234,29,44,0.5)] mb-6 animate-bounce-slow">
           <Zap size={48} className="text-white fill-white" />
        </div>
        <h1 className="text-4xl font-black tracking-tighter mb-2">
           Neo<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA1D2C] to-orange-500">Delivery</span>
        </h1>
        <p className="text-gray-400 text-sm uppercase tracking-widest font-bold">Parceiro</p>
      </div>

      <div className="absolute bottom-10 flex flex-col items-center gap-2">
         <div className="w-8 h-8 border-2 border-white/20 border-t-[#EA1D2C] rounded-full animate-spin"></div>
         <span className="text-gray-600 text-[10px] uppercase tracking-wider">Carregando App...</span>
      </div>
      
      <style>{`
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 3s infinite ease-in-out;
        }
        @keyframes fade-in-up {
           from { opacity: 0; transform: translateY(20px); }
           to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
           animation: fade-in-up 1s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
