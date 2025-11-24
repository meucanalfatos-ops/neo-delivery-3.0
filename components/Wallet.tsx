
import React, { useState, useEffect } from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  Calendar, 
  ChevronRight, 
  DollarSign, 
  CreditCard, 
  Landmark, 
  Lock, 
  Info,
  ChevronLeft,
  Filter,
  Zap,
  CheckCircle,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import { Transaction } from '../types';
import { MOCK_TRANSACTIONS } from '../constants';

interface WalletViewProps {
  onBack?: () => void;
}

const WalletView: React.FC<WalletViewProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState<'statement' | 'bank'>('statement');
  const [selectedWeek, setSelectedWeek] = useState(0); 
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [currentWeekTotal, setCurrentWeekTotal] = useState(0);
  const [todayTotal, setTodayTotal] = useState(0);
  
  const [userData, setUserData] = useState({ 
    name: 'Carlos Silva', 
    pix: '123.456.789-00',
    bankName: 'Nubank',
    pixType: 'CPF'
  });

  useEffect(() => {
    // 1. Carregar transações reais do LocalStorage
    const stored = localStorage.getItem('neo_transactions');
    const realTransactions: Transaction[] = stored ? JSON.parse(stored) : [];
    
    // 2. Combinar com MOCK (para demonstração)
    const allTransactions = [...realTransactions, ...MOCK_TRANSACTIONS];
    
    // Ordenar por data (mais recente primeiro)
    allTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    setTransactions(allTransactions);

    // Calcular totais
    const now = new Date();
    const today = now.toLocaleDateString();
    
    const weekTotal = allTransactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.amount : 0), 0);
    setCurrentWeekTotal(weekTotal);

    const todaySum = allTransactions.reduce((acc, t) => {
        const tDate = new Date(t.date).toLocaleDateString();
        return acc + (tDate === today && t.status === 'completed' ? t.amount : 0);
    }, 0);
    setTodayTotal(todaySum);

    // Carregar dados do usuário
    const storedUser = localStorage.getItem('neo_user_data');
    if (storedUser) {
       setUserData(JSON.parse(storedUser));
    }

  }, []);

  const getNextWednesday = () => {
    const d = new Date();
    d.setDate(d.getDate() + ((3 + 7 - d.getDay()) % 7 || 7));
    return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' });
  };

  // Agrupar transações por dia
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = new Date(transaction.date).toLocaleDateString('pt-BR', {
        day: 'numeric', month: 'long', weekday: 'short'
    });
    if (!groups[date]) {
        groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 animate-fade-in font-sans">
      
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100">
        <div className="p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-lg font-bold text-gray-900">Carteira</h1>
          </div>
          <button className="text-red-600 text-sm font-bold">Ajuda</button>
        </div>

        <div className="flex px-4">
          <button 
            onClick={() => setActiveTab('statement')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'statement' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'
            }`}
          >
            Extrato
          </button>
          <button 
            onClick={() => setActiveTab('bank')}
            className={`flex-1 py-3 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'bank' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'
            }`}
          >
            Conta Bancária
          </button>
        </div>
      </div>

      {activeTab === 'statement' && (
        <div className="p-4 space-y-6">
          
          {/* Cards de Resumo Financeiro */}
          <div className="grid grid-cols-2 gap-4">
             <div className="bg-green-600 text-white p-4 rounded-2xl shadow-lg shadow-green-200">
                <p className="text-xs font-bold text-green-100 uppercase mb-1 flex items-center gap-1"><TrendingUp size={12}/> Ganhos Hoje</p>
                <p className="text-2xl font-black">R$ {todayTotal.toFixed(2).replace('.', ',')}</p>
             </div>
             <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <p className="text-xs font-bold text-gray-400 uppercase mb-1">Semana Atual</p>
                <p className="text-2xl font-black text-gray-900">R$ {currentWeekTotal.toFixed(2).replace('.', ',')}</p>
             </div>
          </div>

          {/* Tarifas Info */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 animate-fade-in">
             <div className="flex items-center justify-between mb-2">
                <h3 className="text-blue-900 font-bold text-sm flex items-center gap-2">
                   <Info size={16}/> Tarifas Vigentes
                </h3>
             </div>
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-xs text-blue-700 mb-1">Valor por KM</p>
                   <p className="text-xl font-black text-blue-900">R$ 1,30 <span className="text-xs font-medium text-blue-600">/km</span></p>
                </div>
                <div className="text-right">
                   <p className="text-xs text-blue-700 mb-1">Mínimo Garantido (0-4km)</p>
                   <p className="text-xl font-black text-blue-900">R$ 6,90</p>
                </div>
             </div>
             <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex justify-between">
                   <p className="text-xs text-blue-800"><span className="font-bold">+R$ 0,25/km</span> acima de 8km</p>
                   <p className="text-xs text-blue-800 text-right"><span className="font-bold">+R$ 2,00</span> Maquininha/Devolução</p>
                </div>
             </div>
          </div>

          {/* Histórico Dia a Dia */}
          <div className="space-y-6">
             {Object.entries(groupedTransactions).map(([date, data]) => {
                const dayTransactions = data as Transaction[];
                const dayTotal = dayTransactions.reduce((acc, t) => acc + (t.status === 'completed' ? t.amount : 0), 0);
                
                return (
                   <div key={date} className="animate-fade-in">
                      <div className="flex items-center justify-between mb-3 px-1">
                         <h3 className="font-bold text-gray-900 text-sm capitalize">{date}</h3>
                         <span className="text-xs font-bold bg-gray-100 px-2 py-1 rounded text-gray-600">
                            Total: R$ {dayTotal.toFixed(2).replace('.', ',')}
                         </span>
                      </div>
                      
                      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                         {dayTransactions.map((t) => (
                             <div key={t.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                               <div className="flex items-center gap-3">
                                 <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'bonus' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-50 text-red-600'}`}>
                                   {t.type === 'bonus' ? <DollarSign size={18}/> : <ArrowDownLeft size={18}/>}
                                 </div>
                                 <div>
                                   <p className="font-bold text-gray-900 text-sm">{t.restaurant}</p>
                                   <p className="text-xs text-gray-400">
                                      {new Date(t.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} • 
                                      {t.distance ? ` ${t.distance}` : ' Ajuste'}
                                      {/* @ts-ignore */}
                                      {t.isAppPayment && <span className="ml-1 text-green-600 font-bold bg-green-50 px-1 rounded">APP</span>}
                                   </p>
                                 </div>
                               </div>
                               <span className="font-bold text-gray-900 text-sm">+ R$ {t.amount.toFixed(2).replace('.', ',')}</span>
                             </div>
                         ))}
                      </div>
                   </div>
                );
             })}
          </div>
        </div>
      )}

      {activeTab === 'bank' && (
        <div className="p-6 space-y-6 animate-fade-in">
           <div className="bg-gray-900 text-white p-6 rounded-2xl shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-20"><Landmark size={100} /></div>
              <div className="flex justify-between items-start relative z-10 mb-6">
                 <span className="font-bold tracking-widest text-sm uppercase">{userData.bankName || 'Seu Banco'}</span>
                 <Zap size={18} className="text-yellow-400" />
              </div>
              <div className="relative z-10">
                 <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Chave PIX ({userData.pixType || 'CPF'})</p>
                 <div className="flex flex-col gap-1 mb-6">
                    <span className="text-xl font-bold tracking-wider font-mono truncate">{userData.pix}</span>
                 </div>
                 
                 <div className="flex items-center gap-2 text-sm bg-green-500/20 w-fit px-3 py-1.5 rounded-full border border-green-500/30">
                    <CheckCircle size={14} className="text-green-400"/>
                    <span className="font-bold text-green-400">Verificada</span>
                 </div>
              </div>
           </div>

           <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
              <div className="flex items-start gap-4">
                 <div className="bg-blue-50 p-3 rounded-full">
                    <RefreshCw className="text-blue-600" size={24} />
                 </div>
                 <div>
                    <h3 className="font-bold text-gray-900 mb-1">Repasse Automático</h3>
                    <p className="text-sm text-gray-500 leading-relaxed mb-3">
                       Seus ganhos acumulados de Segunda a Domingo são transferidos automaticamente para sua chave PIX.
                    </p>
                    <div className="bg-gray-50 px-3 py-2 rounded-lg inline-flex items-center gap-2">
                       <Calendar size={14} className="text-gray-500" />
                       <span className="text-xs font-bold text-gray-700 uppercase">Dia de Depósito: Quarta-feira</span>
                    </div>
                 </div>
              </div>
           </div>
           
           <div className="text-center">
              <p className="text-xs text-gray-400">Para alterar sua chave PIX, acesse <span className="font-bold text-gray-600">Perfil {'>'} Dados Pessoais</span>.</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default WalletView;
