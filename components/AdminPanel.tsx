
import React, { useState } from 'react';
import { 
  Users, 
  CheckCircle, 
  XCircle, 
  FileText, 
  Bike, 
  Search, 
  LogOut, 
  DollarSign, 
  BarChart3, 
  Settings, 
  ShieldCheck,
  Bell,
  TrendingUp,
  Eye,
  Download,
  Layers,
  Map
} from 'lucide-react';
import { MOCK_PENDING_DRIVERS } from '../constants';
import { PendingDriver } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'approvals' | 'settings'>('approvals');
  const [pendingDrivers, setPendingDrivers] = useState<PendingDriver[]>(MOCK_PENDING_DRIVERS);
  const [showDocModal, setShowDocModal] = useState<{isOpen: boolean, type: string, driverName: string, docUrl: string} | null>(null);

  // Configurações Globais
  const [appConfig, setAppConfig] = useState({
    driverRatePerKm: 1.30,
    driverMinFee: 6.90,
    driverDoubleMinFee: 10.50,
    driverTripleMinFee: 14.50,
    fixedAppFee: 1.36,
    appTripleBonus: 1.00, // Novo: Bônus do App para Rota Tripla
    // Configuração de Longa Distância
    longDistanceThreshold: 8,
    longDistanceBonus: 0.25
  });

  const handleApprove = (id: string) => {
    if (window.confirm('Tem certeza que deseja prosseguir com esta ação?')) {
      setPendingDrivers(prev => prev.filter(d => d.id !== id));
      alert('Entregador aprovado com sucesso! Ele receberá uma notificação.');
    }
  };

  const handleReject = (id: string) => {
    if (window.confirm('Tem certeza que deseja prosseguir com esta ação?')) {
      const reason = prompt('Motivo da rejeição:');
      if (reason) {
        setPendingDrivers(prev => prev.filter(d => d.id !== id));
        alert(`Entregador rejeitado. Motivo enviado: ${reason}`);
      }
    }
  };

  const openDoc = (type: string, driverName: string, docUrl: string) => {
    if (!docUrl) return alert('Documento não disponível para este tipo de veículo ou ainda não enviado.');
    setShowDocModal({ isOpen: true, type, driverName, docUrl });
  };

  return (
    <div className="min-h-screen bg-gray-100 font-sans text-gray-900 flex flex-col">
      
      {/* Admin Header */}
      <div className="bg-gray-900 text-white p-4 shadow-md flex justify-between items-center z-20">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Admin Console</h1>
            <p className="text-xs text-gray-400">Master Access</p>
          </div>
        </div>
        <button onClick={onLogout} className="text-gray-400 hover:text-white transition-colors">
          <LogOut size={20} />
        </button>
      </div>

      {/* Admin Nav */}
      <div className="bg-white border-b border-gray-200 px-4 flex gap-6">
        <button 
          onClick={() => setActiveTab('approvals')}
          className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'approvals' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users size={18} /> Aprovações <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded-full">{pendingDrivers.length}</span>
        </button>
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'dashboard' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BarChart3 size={18} /> Visão Geral
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`py-4 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'settings' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Settings size={18} /> Configurações
        </button>
      </div>

      {/* Content Area */}
      <div className="flex-1 p-6 max-w-5xl mx-auto w-full overflow-y-auto">
        
        {/* TAB: APROVAÇÕES */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Solicitações de Cadastro</h2>
                <p className="text-gray-500 text-sm">Gerencie a entrada de novos parceiros na plataforma.</p>
              </div>
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-3 text-gray-400" size={16} />
                <input type="text" placeholder="Buscar por CPF ou Nome" className="pl-9 p-2.5 bg-white border border-gray-200 rounded-lg text-sm w-64 outline-none focus:ring-2 focus:ring-red-500" />
              </div>
            </div>

            {pendingDrivers.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
                  <CheckCircle size={48} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-bold text-gray-900">Tudo limpo!</h3>
                  <p className="text-gray-500">Não há solicitações pendentes no momento.</p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                 {pendingDrivers.map((driver) => (
                   <div key={driver.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col md:flex-row">
                      {/* Left: Basic Info */}
                      <div className="p-6 flex-1 border-b md:border-b-0 md:border-r border-gray-100">
                        <div className="flex items-start justify-between mb-4">
                           <div>
                             <h3 className="text-lg font-bold text-gray-900">{driver.name}</h3>
                             <p className="text-sm text-gray-500">CPF: {driver.cpf}</p>
                           </div>
                           <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-1 rounded uppercase">Pendente</span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                           <div className="flex items-center gap-2">
                              <Bike size={16} />
                              <span>{driver.vehicle}</span>
                           </div>
                           <div className="w-px h-4 bg-gray-300"></div>
                           <div>Placa: <strong>{driver.plate}</strong></div>
                        </div>

                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                           <ClockIcon /> Solicitado em: {new Date(driver.submittedAt).toLocaleString()}
                        </p>
                      </div>

                      {/* Middle: Documents */}
                      <div className="p-6 w-full md:w-1/3 bg-gray-50/50 flex flex-col justify-center gap-3 border-b md:border-b-0 md:border-r border-gray-100">
                         <h4 className="text-xs font-bold text-gray-500 uppercase">Documentação Anexada</h4>
                         <button 
                           onClick={() => openDoc('CNH', driver.name, driver.documents.cnh)}
                           className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-sm group"
                         >
                            <span className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /> CNH Digital</span>
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:underline">
                              <Eye size={12}/> Ver
                            </span>
                         </button>
                         <button 
                           onClick={() => openDoc('CRLV', driver.name, driver.documents.crlv)}
                           className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 transition-colors text-sm group"
                         >
                            <span className="flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Doc. Veículo</span>
                            <span className="text-xs text-blue-600 font-medium flex items-center gap-1 group-hover:underline">
                              <Eye size={12}/> Ver
                            </span>
                         </button>
                      </div>

                      {/* Right: Actions */}
                      <div className="p-6 w-full md:w-48 flex flex-col justify-center gap-3 bg-gray-50">
                         <button 
                           onClick={() => handleApprove(driver.id)}
                           className="w-full py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                         >
                            <CheckCircle size={16} /> Aprovar
                         </button>
                         <button 
                           onClick={() => handleReject(driver.id)}
                           className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg font-bold text-sm transition-colors flex items-center justify-center gap-2"
                         >
                            <XCircle size={16} /> Recusar
                         </button>
                      </div>
                   </div>
                 ))}
               </div>
            )}
          </div>
        )}

        {/* TAB: DASHBOARD */}
        {activeTab === 'dashboard' && (
           <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                       <DollarSign size={20} />
                       <span className="font-medium text-sm">Lucro Líquido (App)</span>
                    </div>
                    <p className="text-3xl font-bold text-gray-900">R$ 2.450,00</p>
                    <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded mt-2 inline-block">R$ {appConfig.fixedAppFee} (Base/4km)</span>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                       <Users size={20} />
                       <span className="font-medium text-sm">Entregadores Online</span>
                    </div>
                    <p className="text-3xl font-bold text-green-600">142</p>
                 </div>
                 <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 text-gray-500 mb-2">
                       <Bell size={20} />
                       <span className="font-medium text-sm">Pedidos em Andamento</span>
                    </div>
                    <p className="text-3xl font-bold text-blue-600">89</p>
                 </div>
              </div>
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-96 flex items-center justify-center">
                 <p className="text-gray-400 italic">Gráficos de desempenho global seriam renderizados aqui.</p>
              </div>
           </div>
        )}

        {/* TAB: CONFIGURAÇÕES */}
        {activeTab === 'settings' && (
           <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 animate-fade-in max-w-3xl">
              <h3 className="font-bold text-lg mb-6 flex items-center gap-2"><Settings className="text-gray-400"/> Configurações Financeiras</h3>
              
              <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 mb-6">
                 <div className="flex items-start gap-3">
                    <TrendingUp className="text-blue-600 mt-1" size={20} />
                    <div>
                       <h4 className="font-bold text-blue-900">Lucro Escalonado</h4>
                       <p className="text-sm text-blue-700">
                          Base de R$ {appConfig.fixedAppFee} a cada 4km. Rotas Triplas adicionam +R$ {appConfig.appTripleBonus}.
                       </p>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-6">
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Custo Motorista p/ KM (R$)</label>
                    <input 
                      type="number" 
                      value={appConfig.driverRatePerKm}
                      onChange={(e) => setAppConfig({...appConfig, driverRatePerKm: Number(e.target.value)})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Taxa Mínima Simples (R$)</label>
                    <input 
                      type="number" 
                      value={appConfig.driverMinFee}
                      onChange={(e) => setAppConfig({...appConfig, driverMinFee: Number(e.target.value)})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                       Taxa Mínima Rota Dupla (R$) <Layers size={14} className="text-purple-500"/>
                    </label>
                    <input 
                      type="number" 
                      value={appConfig.driverDoubleMinFee}
                      onChange={(e) => setAppConfig({...appConfig, driverDoubleMinFee: Number(e.target.value)})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-purple-500 bg-purple-50 text-purple-900 font-bold outline-none" 
                    />
                 </div>
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                       Taxa Mínima Rota Tripla (R$) <Layers size={14} className="text-indigo-500"/>
                    </label>
                    <input 
                      type="number" 
                      value={appConfig.driverTripleMinFee}
                      onChange={(e) => setAppConfig({...appConfig, driverTripleMinFee: Number(e.target.value)})}
                      className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-indigo-500 bg-indigo-50 text-indigo-900 font-bold outline-none" 
                    />
                 </div>
                 
                 {/* Configuração de Longa Distância */}
                 <div className="p-3 bg-green-50 border border-green-100 rounded-lg col-span-2 md:col-span-1">
                    <div className="flex items-center gap-2 mb-2">
                        <Map size={16} className="text-green-600"/>
                        <span className="font-bold text-green-900 text-sm">Bônus Longa Distância</span>
                    </div>
                    <div className="flex gap-4">
                        <div>
                            <label className="text-[10px] font-bold text-green-700 uppercase">Acima de (KM)</label>
                            <input 
                                type="number" 
                                value={appConfig.longDistanceThreshold}
                                onChange={(e) => setAppConfig({...appConfig, longDistanceThreshold: Number(e.target.value)})}
                                className="w-full p-2 rounded border border-green-200 text-sm" 
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold text-green-700 uppercase">Add p/ KM (R$)</label>
                            <input 
                                type="number" 
                                value={appConfig.longDistanceBonus}
                                onChange={(e) => setAppConfig({...appConfig, longDistanceBonus: Number(e.target.value)})}
                                className="w-full p-2 rounded border border-green-200 text-sm" 
                            />
                        </div>
                    </div>
                 </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Lucro Base do App (R$)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                          type="number" 
                          step="0.01"
                          value={appConfig.fixedAppFee} 
                          onChange={(e) => setAppConfig({...appConfig, fixedAppFee: Number(e.target.value)})}
                          className="w-full p-3 pl-10 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-red-500 outline-none bg-gray-50 text-gray-900"
                        />
                     </div>
                     <p className="text-xs text-gray-500 mt-2">
                        Valor base para os primeiros 4km.
                     </p>
                  </div>
                  <div>
                     <label className="block text-sm font-bold text-gray-900 mb-2">Taxa Extra App (Rota Tripla)</label>
                     <div className="relative">
                        <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                        <input 
                          type="number" 
                          step="0.01"
                          value={appConfig.appTripleBonus} 
                          onChange={(e) => setAppConfig({...appConfig, appTripleBonus: Number(e.target.value)})}
                          className="w-full p-3 pl-10 border rounded-lg text-lg font-bold focus:ring-2 focus:ring-indigo-500 outline-none bg-indigo-50 text-indigo-900"
                        />
                     </div>
                     <p className="text-xs text-gray-500 mt-2">
                        Adicional de lucro para rotas de 3 pedidos.
                     </p>
                  </div>
              </div>

              <div className="pt-6 border-t border-gray-100">
                 <button className="w-full py-3 bg-gray-900 text-white rounded-lg font-bold hover:bg-gray-800 transition-colors shadow-lg">
                    Salvar Novas Regras
                 </button>
              </div>
           </div>
        )}

      </div>

      {/* Document Modal - Viewer */}
      {showDocModal && (
         <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowDocModal(null)}>
            <div className="bg-transparent max-w-4xl w-full flex flex-col" onClick={e => e.stopPropagation()}>
               <div className="flex justify-between items-center text-white mb-4 px-2">
                  <div>
                    <h3 className="font-bold text-lg">{showDocModal.type}</h3>
                    <p className="text-sm opacity-80">Entregador: {showDocModal.driverName}</p>
                  </div>
                  <button onClick={() => setShowDocModal(null)} className="p-2 hover:bg-white/20 rounded-full transition-colors">
                    <XCircle size={32} />
                  </button>
               </div>
               
               <div className="relative rounded-lg overflow-hidden shadow-2xl bg-black flex items-center justify-center max-h-[80vh]">
                  <img 
                    src={showDocModal.docUrl} 
                    alt={`Documento ${showDocModal.type}`} 
                    className="max-w-full max-h-[80vh] object-contain"
                  />
               </div>

               <div className="mt-6 flex justify-center gap-4">
                  <a 
                    href={showDocModal.docUrl} 
                    download 
                    target="_blank"
                    rel="noreferrer"
                    className="px-6 py-3 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-colors flex items-center gap-2 shadow-lg"
                  >
                    <Download size={20} /> Baixar Original
                  </a>
                  <button onClick={() => setShowDocModal(null)} className="px-6 py-3 border border-white text-white font-bold rounded-full hover:bg-white/10 transition-colors">
                    Fechar Visualização
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

const ClockIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
)

export default AdminPanel;
