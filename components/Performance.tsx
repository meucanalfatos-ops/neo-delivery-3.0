
import React, { useState } from 'react';
import { Trophy, Star, AlertCircle, Clock, CheckCircle, Sparkles, ChevronLeft, TrendingUp, Shield, Zap, Gift, ChevronRight, Info } from 'lucide-react';
import { MOCK_STATS } from '../constants';
import { getDriverAdvice } from '../services/geminiService';

interface PerformanceProps {
  onBack?: () => void;
}

const PerformanceView: React.FC<PerformanceProps> = ({ onBack }) => {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [activeTab, setActiveTab] = useState<'metrics' | 'benefits'>('metrics');

  const handleGetAdvice = async () => {
    setLoadingAdvice(true);
    const text = await getDriverAdvice(MOCK_STATS);
    setAdvice(text);
    setLoadingAdvice(false);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Bronze': return 'from-orange-700 to-orange-500';
      case 'Ouro': return 'from-yellow-500 to-yellow-600';
      case 'Diamante': return 'from-cyan-500 to-blue-600';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const getNextLevel = (level: string) => {
     if (level === 'Bronze') return { name: 'Ouro', points: 500 };
     if (level === 'Ouro') return { name: 'Diamante', points: 1000 };
     return { name: 'Lenda', points: 1500 }; // Max
  };

  const nextLevel = getNextLevel(MOCK_STATS.level);
  const progressPercent = Math.min(100, (MOCK_STATS.score / nextLevel.points) * 100);

  // Mock de Histórico Semanal
  const weeklyHistory = [
     { day: 'S', score: 820 },
     { day: 'T', score: 830 },
     { day: 'Q', score: 815 }, // Queda
     { day: 'Q', score: 840 },
     { day: 'S', score: 845 },
     { day: 'S', score: 850 }, // Atual
  ];

  const benefits = [
    { level: 'Bronze', perks: ['Acesso ao App', 'Suporte Básico'], active: true },
    { level: 'Ouro', perks: ['Prioridade em Rota Dupla', 'Suporte Prioritário', 'Desconto em Combustível'], active: MOCK_STATS.level === 'Ouro' || MOCK_STATS.level === 'Diamante' },
    { level: 'Diamante', perks: ['Prioridade Máxima (Toca Primeiro)', 'Rota Tripla Exclusiva', 'Seguro de Vida Premium', 'Clube de Vantagens'], active: MOCK_STATS.level === 'Diamante' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 font-sans animate-fade-in flex flex-col">
      {/* Header */}
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          {onBack && (
            <button 
              onClick={onBack}
              className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1 className="text-lg font-bold text-gray-900">Desempenho</h1>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r ${getLevelColor(MOCK_STATS.level)} shadow-md flex items-center gap-1`}>
           <Trophy size={12} fill="currentColor" /> {MOCK_STATS.level}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white border-b border-gray-100 px-4">
         <button 
           onClick={() => setActiveTab('metrics')}
           className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'metrics' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}
         >
            Minhas Métricas
         </button>
         <button 
           onClick={() => setActiveTab('benefits')}
           className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${activeTab === 'benefits' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-400'}`}
         >
            Benefícios
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        
        {activeTab === 'metrics' && (
           <>
              {/* Score Gauge / Velocímetro */}
              <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 relative overflow-hidden text-center">
                 <h2 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4">Score Geral</h2>
                 
                 <div className="relative w-64 h-32 mx-auto overflow-hidden">
                    {/* Background Arc */}
                    <div className="absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-gray-100 box-border"></div>
                    {/* Progress Arc (Simulado com clip-path ou rotate) */}
                    <div 
                       className={`absolute top-0 left-0 w-full h-64 rounded-full border-[20px] border-transparent border-t-green-500 border-l-green-500 transition-transform duration-1000 ease-out`}
                       style={{ transform: `rotate(${(MOCK_STATS.score / 1000) * 180 - 45}deg)` }} // Simplificação visual CSS
                    ></div>
                    {/* SVG Real Implementation for better control */}
                    <svg viewBox="0 0 200 100" className="absolute top-0 left-0 w-full h-full">
                       <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="#f3f4f6" strokeWidth="20" strokeLinecap="round" />
                       <path 
                          d="M 20 100 A 80 80 0 0 1 180 100" 
                          fill="none" 
                          stroke="url(#scoreGradient)" 
                          strokeWidth="20" 
                          strokeLinecap="round"
                          strokeDasharray="251"
                          strokeDashoffset={251 - (251 * (MOCK_STATS.score / 1000))} // 0 a 1000
                          className="transition-all duration-1000 ease-out"
                       />
                       <defs>
                          <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                             <stop offset="0%" stopColor="#ef4444" />
                             <stop offset="50%" stopColor="#eab308" />
                             <stop offset="100%" stopColor="#22c55e" />
                          </linearGradient>
                       </defs>
                    </svg>

                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center">
                       <span className="text-5xl font-black text-gray-900 tracking-tighter">{MOCK_STATS.score}</span>
                       <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2 rounded mt-1">de 1000</span>
                    </div>
                 </div>

                 {/* Level Progress */}
                 <div className="mt-6">
                    <div className="flex justify-between text-xs font-bold text-gray-500 mb-2">
                       <span>{MOCK_STATS.level}</span>
                       <span>{nextLevel.name}</span>
                    </div>
                    <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden relative">
                       <div 
                          className={`h-full bg-gradient-to-r ${getLevelColor(MOCK_STATS.level)} transition-all duration-1000`} 
                          style={{ width: `${progressPercent}%` }}
                       ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-center">
                       Faltam <strong>{nextLevel.points - MOCK_STATS.score} pontos</strong> para o próximo nível.
                    </p>
                 </div>
              </div>

              {/* Weekly History Chart */}
              <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
                 <div className="flex items-center gap-2 mb-4">
                    <TrendingUp size={18} className="text-blue-600" />
                    <h3 className="font-bold text-gray-900 text-sm">Evolução Semanal</h3>
                 </div>
                 <div className="flex items-end justify-between h-24 gap-2">
                    {weeklyHistory.map((h, i) => (
                       <div key={i} className="flex flex-col items-center flex-1 group">
                          <div className="relative w-full flex justify-center">
                             <div 
                                className={`w-full max-w-[12px] rounded-t-lg transition-all duration-500 ${i === weeklyHistory.length - 1 ? 'bg-blue-600' : 'bg-gray-200 group-hover:bg-blue-300'}`}
                                style={{ height: `${(h.score / 1000) * 80}px` }}
                             ></div>
                             {/* Tooltip */}
                             <div className="absolute -top-8 bg-gray-900 text-white text-[10px] px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                                {h.score}
                             </div>
                          </div>
                          <span className={`text-[10px] mt-2 font-bold ${i === weeklyHistory.length - 1 ? 'text-blue-600' : 'text-gray-400'}`}>{h.day}</span>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-2 gap-4">
                 <MetricCard 
                    icon={CheckCircle} color="text-green-600" 
                    label="Aceitação" value={`${MOCK_STATS.acceptanceRate}%`} 
                    subtext="Meta: >90%" status="good"
                 />
                 <MetricCard 
                    icon={AlertCircle} color="text-red-600" 
                    label="Cancelamento" value={`${MOCK_STATS.cancellationRate}%`} 
                    subtext="Meta: <4%" status={MOCK_STATS.cancellationRate < 4 ? "good" : "bad"}
                 />
                 <MetricCard 
                    icon={Star} color="text-yellow-500" 
                    label="Avaliação" value={MOCK_STATS.customerRating.toFixed(2)} 
                    subtext="Média dos clientes" status="good"
                 />
                 <MetricCard 
                    icon={Clock} color="text-blue-600" 
                    label="Pontualidade" value={`${MOCK_STATS.onTimeRate}%`} 
                    subtext="Entregas no prazo" status="good"
                 />
              </div>

              {/* AI Coach */}
              <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200 relative overflow-hidden">
                 <div className="absolute top-0 right-0 -mt-4 -mr-4 opacity-10">
                    <Sparkles size={120} />
                 </div>
                 <div className="relative z-10">
                    <h3 className="font-bold text-lg mb-2 flex items-center gap-2">
                       <Sparkles size={18} /> Neo Coach
                    </h3>
                    <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/10 mb-4">
                       <p className="text-sm leading-relaxed text-indigo-50">
                          {advice || "Analisando seus dados para gerar a melhor estratégia..."}
                       </p>
                    </div>
                    <button 
                       onClick={handleGetAdvice}
                       disabled={loadingAdvice}
                       className="w-full py-3 bg-white text-indigo-700 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                       {loadingAdvice ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-700"></div> : 'Gerar Nova Dica'}
                    </button>
                 </div>
              </div>
           </>
        )}

        {activeTab === 'benefits' && (
           <div className="space-y-4 animate-fade-in">
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                 <Info className="text-blue-600 shrink-0" size={20} />
                 <p className="text-xs text-blue-800 leading-relaxed">
                    Seu nível é atualizado toda segunda-feira baseado na sua performance dos últimos 28 dias.
                 </p>
              </div>

              {benefits.map((tier) => (
                 <div key={tier.level} className={`border rounded-2xl overflow-hidden transition-all ${tier.active ? 'bg-white border-green-500 shadow-md ring-1 ring-green-100' : 'bg-gray-50 border-gray-200 opacity-70 grayscale'}`}>
                    <div className={`p-4 flex justify-between items-center ${tier.active ? 'bg-green-50' : 'bg-gray-100'}`}>
                       <h3 className="font-bold text-gray-900 flex items-center gap-2">
                          <Trophy size={16} className={tier.level === 'Ouro' ? 'text-yellow-600' : tier.level === 'Diamante' ? 'text-blue-500' : 'text-orange-700'} />
                          Nível {tier.level}
                       </h3>
                       {tier.active ? (
                          <span className="text-[10px] bg-green-200 text-green-800 px-2 py-0.5 rounded-full font-bold uppercase">Ativo</span>
                       ) : (
                          <LockIcon />
                       )}
                    </div>
                    <div className="p-4 space-y-3">
                       {tier.perks.map((perk, i) => (
                          <div key={i} className="flex items-center gap-3">
                             <CheckCircle size={16} className={tier.active ? "text-green-500" : "text-gray-400"} />
                             <span className="text-sm text-gray-700">{perk}</span>
                          </div>
                       ))}
                    </div>
                 </div>
              ))}
           </div>
        )}

      </div>
    </div>
  );
};

// Sub-componentes para limpeza
const MetricCard = ({ icon: Icon, color, label, value, subtext, status }: any) => (
   <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between h-32">
      <div className="flex justify-between items-start">
         <div className={`p-2 rounded-lg bg-gray-50 ${color}`}>
            <Icon size={20} />
         </div>
         {status === 'good' ? (
            <TrendingUp size={16} className="text-green-500" />
         ) : (
            <AlertCircle size={16} className="text-red-500" />
         )}
      </div>
      <div>
         <p className="text-2xl font-black text-gray-900">{value}</p>
         <p className="text-xs font-bold text-gray-500 uppercase">{label}</p>
         <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>
      </div>
   </div>
);

const LockIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
)

export default PerformanceView;
