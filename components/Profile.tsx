
import React, { useState, useEffect } from 'react';
import { User, Settings, Bike, FileText, HelpCircle, ChevronRight, ChevronLeft, LogOut, Camera, Plus, Save, CheckCircle, Shield, Mail, Phone, Send, MessageSquare, Paperclip, X, Bell, Volume2, Zap, Smartphone, AlertCircle, Trash2, Loader2, Clock, Box, CreditCard, MoreHorizontal, Landmark, Hash, Building2 } from 'lucide-react';

interface ProfileProps {
  onLogout: () => void;
  onBack?: () => void;
}

type ProfileView = 'menu' | 'account' | 'vehicles' | 'documents' | 'notifications' | 'support';

const BANKS = [
  'Nubank', 'Banco Inter', 'Itaú', 'Bradesco', 'Banco do Brasil', 'Santander', 'Caixa', 'C6 Bank', 'Neon', 'Original'
];

const PIX_TYPES = [
  'CPF', 'Celular', 'Email', 'Chave Aleatória'
];

const Profile: React.FC<ProfileProps> = ({ onLogout, onBack }) => {
  const [view, setView] = useState<ProfileView>('menu');

  // --- States for Sub-views ---
  
  // Account - Load from localStorage if available
  const [userData, setUserData] = useState(() => {
    const saved = localStorage.getItem('neo_user_data');
    return saved ? JSON.parse(saved) : {
      name: 'Carlos Silva',
      email: 'carlos.silva@email.com',
      phone: '(11) 98765-4321',
      pix: '123.456.789-00', // Default mock PIX
      pixType: 'CPF',
      bankName: 'Nubank',
      cpf: '123.456.789-00'
    };
  });

  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Vehicles
  const [vehicles, setVehicles] = useState([
    { id: 1, model: 'Honda CG 160', plate: 'ABC-1234', active: true },
    { id: 2, model: 'Bike Elétrica', plate: 'N/A', active: false }
  ]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({ model: '', plate: '' });

  // Documents Status
  const [docStatus, setDocStatus] = useState({
    cnh: 'approved', // 'approved' | 'reviewing'
    crlv: 'approved'
  });

  // Notifications Settings with Persistence
  const [notifSettings, setNotifSettings] = useState(() => {
    const saved = localStorage.getItem('neo_notif_settings');
    return saved ? JSON.parse(saved) : {
      newOrders: true,
      promotions: false,
      sound: true,
      vibration: true,
      emailUpdates: false
    };
  });

  // Save settings whenever they change
  useEffect(() => {
    localStorage.setItem('neo_notif_settings', JSON.stringify(notifSettings));
  }, [notifSettings]);

  // Support Form State
  const [supportForm, setSupportForm] = useState({
    name: userData.name, // Pre-fill
    email: userData.email, // Pre-fill
    message: ''
  });
  const [supportFile, setSupportFile] = useState<File | null>(null);
  const [supportSuccess, setSupportSuccess] = useState(false);
  
  // FAQ State
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  // --- Handlers ---

  const handleBack = () => {
    if (view === 'menu') {
      if (onBack) onBack();
    } else {
      setView('menu');
    }
  };

  const handleSaveAccount = () => {
    setIsSavingAccount(true);
    // Simulation of API call and Persistence
    setTimeout(() => {
      localStorage.setItem('neo_user_data', JSON.stringify(userData));
      setIsSavingAccount(false);
      setIsEditingAccount(false);
    }, 1000);
  };

  const handleAddVehicle = () => {
    if (!newVehicle.model) return;
    const v = {
      id: Date.now(),
      model: newVehicle.model,
      plate: newVehicle.plate || 'N/A',
      active: false
    };
    setVehicles([...vehicles, v]);
    setNewVehicle({ model: '', plate: '' });
    setShowAddVehicle(false);
  };

  const handleDeleteVehicle = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (window.confirm('Tem certeza que deseja remover este veículo?')) {
      setVehicles(prev => prev.filter(v => v.id !== id));
    }
  };

  const toggleVehicle = (id: number) => {
    setVehicles(vehicles.map(v => ({
      ...v,
      active: v.id === id
    })));
  };

  const handleDocUpdate = (docType: 'cnh' | 'crlv', e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDocStatus(prev => ({ ...prev, [docType]: 'reviewing' }));
      alert('Documento enviado para análise!');
    }
  };

  const toggleNotification = (key: keyof typeof notifSettings) => {
    setNotifSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSupportFile(e.target.files[0]);
    }
  };

  const handleRemoveFile = () => {
    setSupportFile(null);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("=== FORMULÁRIO DE SUPORTE ENVIADO ===");
    console.log("Nome:", supportForm.name);
    console.log("Email:", supportForm.email);
    console.log("Mensagem:", supportForm.message);
    if (supportFile) {
        console.log("Arquivo Anexado:", supportFile.name, `(${supportFile.size} bytes)`);
    } else {
        console.log("Nenhum arquivo anexado.");
    }
    console.log("=====================================");

    const newTicket = {
        id: Date.now().toString(),
        driverName: supportForm.name,
        message: supportForm.message,
        date: new Date().toISOString(),
        status: 'open',
        type: 'Suporte Geral'
    };
    const existingTickets = JSON.parse(localStorage.getItem('neo_support_tickets') || '[]');
    localStorage.setItem('neo_support_tickets', JSON.stringify([newTicket, ...existingTickets]));

    setSupportSuccess(true);
    setSupportForm(prev => ({ ...prev, message: '' }));
    setSupportFile(null);
    setTimeout(() => setSupportSuccess(false), 3000);
  };
  
  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const selectSupportShortcut = (text: string) => {
    setSupportForm(prev => ({ ...prev, message: text }));
  };

  // --- Render Sub-views ---

  const renderAccount = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="text-center mb-6">
        <div className="w-24 h-24 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center relative border-4 border-white shadow-lg group cursor-pointer">
           <User size={40} className="text-gray-400" />
           <div className="absolute inset-0 bg-black/30 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
             <Camera size={24} className="text-white" />
           </div>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{userData.name}</h2>
        <div className="flex justify-center gap-2">
          <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full font-bold uppercase">Ouro</span>
          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-bold">ID: #8492</span>
        </div>
      </div>

      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
        <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
           <User size={18} className="text-gray-400"/> Dados Pessoais
        </h3>
        
        {/* NOME */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
          <input 
            disabled={!isEditingAccount}
            type="text" 
            value={userData.name} 
            onChange={(e) => setUserData({...userData, name: e.target.value})}
            className={`w-full p-3 rounded-xl outline-none transition-all ${isEditingAccount ? 'bg-white border border-red-200 ring-2 ring-red-50' : 'bg-gray-50 border-transparent'}`}
          />
        </div>

        {/* CPF (PROTEGIDO) */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 flex items-center justify-between">
             CPF
             <span className="text-[10px] bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded flex items-center gap-1"><Shield size={10}/> Protegido</span>
          </label>
          <input 
            disabled
            type="text" 
            value={userData.cpf.replace(/^\d{3}\.\d{3}/, '***.***')} 
            className="w-full p-3 bg-gray-100 rounded-xl outline-none text-gray-500 cursor-not-allowed border-transparent"
          />
          {isEditingAccount && <p className="text-[10px] text-gray-400 mt-1">Para alterar o CPF, entre em contato com o suporte.</p>}
        </div>

        {/* EMAIL */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
          <input 
            disabled={!isEditingAccount}
            type="email" 
            value={userData.email} 
            onChange={(e) => setUserData({...userData, email: e.target.value})}
            className={`w-full p-3 rounded-xl outline-none transition-all ${isEditingAccount ? 'bg-white border border-red-200 ring-2 ring-red-50' : 'bg-gray-50 border-transparent'}`}
          />
        </div>

        {/* TELEFONE */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Celular</label>
          <input 
            disabled={!isEditingAccount}
            type="tel" 
            value={userData.phone} 
            onChange={(e) => setUserData({...userData, phone: e.target.value})}
            className={`w-full p-3 rounded-xl outline-none transition-all ${isEditingAccount ? 'bg-white border border-red-200 ring-2 ring-red-50' : 'bg-gray-50 border-transparent'}`}
          />
        </div>
      </div>

      {/* DADOS BANCÁRIOS REVAMPED */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 space-y-4">
         <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            <Landmark size={18} className="text-gray-400"/> Dados Bancários
         </h3>

         {/* Cartão Virtual Visual */}
         <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 text-white relative overflow-hidden shadow-lg mb-4">
            <div className="absolute top-0 right-0 p-6 opacity-10"><Landmark size={80} /></div>
            <div className="flex justify-between items-start relative z-10 mb-6">
               <span className="font-bold tracking-widest text-sm uppercase">{userData.bankName || 'Seu Banco'}</span>
               <Zap size={18} className="text-yellow-400" />
            </div>
            <div className="relative z-10">
               <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Chave PIX ({userData.pixType || 'CPF'})</p>
               <p className="text-lg font-mono font-bold tracking-wide truncate">{userData.pix || '---'}</p>
            </div>
            <div className="mt-4 relative z-10 flex items-center gap-2">
               <div className="w-6 h-4 bg-yellow-500/80 rounded"></div>
               <p className="text-xs text-gray-300 uppercase font-bold">{userData.name}</p>
            </div>
         </div>

         {/* Formulário Bancário */}
         <div className="grid gap-4">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Instituição Bancária</label>
               {isEditingAccount ? (
                  <div className="relative">
                     <Building2 className="absolute left-3 top-3 text-gray-400" size={18} />
                     <select 
                        value={userData.bankName || 'Nubank'} 
                        onChange={(e) => setUserData({...userData, bankName: e.target.value})}
                        className="w-full p-3 pl-10 bg-white border border-red-200 ring-2 ring-red-50 rounded-xl outline-none appearance-none font-medium text-gray-700"
                     >
                        {BANKS.map(bank => <option key={bank} value={bank}>{bank}</option>)}
                     </select>
                  </div>
               ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-transparent text-gray-700 flex items-center gap-2">
                     <Building2 size={18} className="text-gray-400" />
                     {userData.bankName || 'Não informado'}
                  </div>
               )}
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Tipo de Chave</label>
               {isEditingAccount ? (
                  <div className="relative">
                     <Hash className="absolute left-3 top-3 text-gray-400" size={18} />
                     <select 
                        value={userData.pixType || 'CPF'} 
                        onChange={(e) => setUserData({...userData, pixType: e.target.value})}
                        className="w-full p-3 pl-10 bg-white border border-red-200 ring-2 ring-red-50 rounded-xl outline-none appearance-none font-medium text-gray-700"
                     >
                        {PIX_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                     </select>
                  </div>
               ) : (
                  <div className="p-3 bg-gray-50 rounded-xl border border-transparent text-gray-700 flex items-center gap-2">
                     <Hash size={18} className="text-gray-400" />
                     {userData.pixType || 'CPF'}
                  </div>
               )}
            </div>

            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Chave PIX</label>
               <input 
                  disabled={!isEditingAccount}
                  type="text" 
                  value={userData.pix} 
                  onChange={(e) => setUserData({...userData, pix: e.target.value})}
                  className={`w-full p-3 rounded-xl outline-none transition-all font-mono font-bold text-gray-800 ${isEditingAccount ? 'bg-white border border-red-200 ring-2 ring-red-50' : 'bg-gray-50 border-transparent'}`}
                  placeholder="Digite sua chave aqui"
               />
            </div>
         </div>

         {isEditingAccount && (
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-100 flex items-start gap-2 mt-2">
               <AlertCircle size={16} className="text-yellow-600 mt-0.5 shrink-0" />
               <p className="text-xs text-yellow-700 leading-tight">
                  A conta bancária deve estar registrada no mesmo CPF cadastrado no aplicativo. Contas de terceiros não serão aceitas.
               </p>
            </div>
         )}
      </div>

      {isEditingAccount ? (
        <div className="flex gap-3">
           <button 
            disabled={isSavingAccount}
            onClick={() => setIsEditingAccount(false)}
            className="flex-1 py-4 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
          >
            Cancelar
          </button>
          <button 
            disabled={isSavingAccount}
            onClick={handleSaveAccount}
            className="flex-1 py-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 shadow-lg shadow-green-100 flex items-center justify-center gap-2 transition-colors disabled:opacity-70"
          >
            {isSavingAccount ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
            {isSavingAccount ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsEditingAccount(true)}
          className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 shadow-lg flex items-center justify-center gap-2 transition-colors"
        >
          <Settings size={18} /> Editar Dados
        </button>
      )}
    </div>
  );

  const renderVehicles = () => (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
         <div className="bg-blue-100 p-2 rounded-lg h-fit"><Bike size={20} className="text-blue-600"/></div>
         <div>
            <p className="text-sm font-bold text-blue-900">Gerencie sua frota</p>
            <p className="text-xs text-blue-700 mt-1">Selecione o veículo que está usando hoje. Apenas veículos inativos podem ser removidos.</p>
         </div>
      </div>

      <div className="space-y-3">
        {vehicles.map(v => (
          <div 
            key={v.id}
            onClick={() => toggleVehicle(v.id)}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between relative overflow-hidden ${
              v.active 
                ? 'border-red-500 bg-white shadow-md' 
                : 'border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300'
            }`}
          >
            {v.active && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-red-500"></div>}
            <div className="flex items-center gap-4 pl-2">
              <div className={`p-3 rounded-full ${v.active ? 'bg-red-50 text-red-600' : 'bg-white text-gray-400'}`}>
                <Bike size={24} />
              </div>
              <div>
                <h3 className={`font-bold ${v.active ? 'text-gray-900' : 'text-gray-500'}`}>{v.model}</h3>
                <p className="text-xs text-gray-400">{v.plate}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {v.active ? (
                <div className="flex items-center gap-2 text-red-600 font-bold text-sm bg-red-50 px-3 py-1 rounded-full">
                    <CheckCircle size={16} /> Ativo
                </div>
              ) : (
                <>
                  <span className="text-xs font-bold text-gray-400 px-2">Selecionar</span>
                  <button 
                    onClick={(e) => handleDeleteVehicle(e, v.id)}
                    className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-10"
                    title="Excluir veículo"
                  >
                    <Trash2 size={18} />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {showAddVehicle ? (
        <div className="bg-white p-5 rounded-2xl shadow-lg border border-gray-100 animate-fade-in">
          <h3 className="font-bold text-gray-900 mb-4">Adicionar Veículo</h3>
          <div className="space-y-4 mb-6">
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Modelo</label>
               <input 
                 type="text" 
                 placeholder="Ex: Honda PCX 150" 
                 value={newVehicle.model}
                 onChange={(e) => setNewVehicle({...newVehicle, model: e.target.value})}
                 className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Placa</label>
               <input 
                 type="text" 
                 placeholder="ABC-1234" 
                 value={newVehicle.plate}
                 onChange={(e) => setNewVehicle({...newVehicle, plate: e.target.value})}
                 className="w-full p-3 bg-gray-50 rounded-xl outline-none focus:ring-2 focus:ring-red-500 transition-all"
               />
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setShowAddVehicle(false)}
              className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200"
            >
              Cancelar
            </button>
            <button 
              onClick={handleAddVehicle}
              className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200"
            >
              Salvar Veículo
            </button>
          </div>
        </div>
      ) : (
        <button 
          onClick={() => setShowAddVehicle(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl font-bold hover:border-red-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center gap-2 transition-all"
        >
          <Plus size={18} /> Cadastrar Novo Veículo
        </button>
      )}
    </div>
  );

  const renderDocuments = () => (
    <div className="space-y-4 animate-fade-in">
      <div className="bg-green-50 border border-green-100 p-4 rounded-xl flex items-start gap-3">
        <Shield className="text-green-600 shrink-0" size={20} />
        <div>
          <h3 className="font-bold text-green-900 text-sm">Status da Conta</h3>
          <p className="text-xs text-green-700 mt-1">
             {docStatus.cnh === 'reviewing' || docStatus.crlv === 'reviewing' 
               ? 'Seus documentos estão sendo analisados pela equipe.'
               : 'Toda sua documentação está em dia.'}
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2.5 rounded-lg"><FileText size={20} className="text-gray-600"/></div>
            <div>
              <p className="font-bold text-gray-900 text-sm">CNH Digital</p>
              {docStatus.cnh === 'approved' ? (
                 <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={10}/> Aprovado • Vence em 10/2025</p>
              ) : (
                 <p className="text-xs text-yellow-600 font-medium flex items-center gap-1"><Clock size={10}/> Em Análise</p>
              )}
            </div>
          </div>
          <label className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${docStatus.cnh === 'reviewing' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
             {docStatus.cnh === 'reviewing' ? 'Enviado' : 'Atualizar'}
             <input 
               disabled={docStatus.cnh === 'reviewing'}
               type="file" 
               accept="image/*,.pdf" 
               className="hidden" 
               onChange={(e) => handleDocUpdate('cnh', e)} 
             />
          </label>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2.5 rounded-lg"><FileText size={20} className="text-gray-600"/></div>
            <div>
              <p className="font-bold text-gray-900 text-sm">CRLV (Veículo)</p>
              {docStatus.crlv === 'approved' ? (
                 <p className="text-xs text-green-600 font-medium flex items-center gap-1"><CheckCircle size={10}/> Aprovado • Exercício 2024</p>
              ) : (
                 <p className="text-xs text-yellow-600 font-medium flex items-center gap-1"><Clock size={10}/> Em Análise</p>
              )}
            </div>
          </div>
          <label className={`px-3 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-colors ${docStatus.crlv === 'reviewing' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'text-blue-600 bg-blue-50 hover:bg-blue-100'}`}>
             {docStatus.crlv === 'reviewing' ? 'Enviado' : 'Atualizar'}
             <input 
               disabled={docStatus.crlv === 'reviewing'}
               type="file" 
               accept="image/*,.pdf" 
               className="hidden" 
               onChange={(e) => handleDocUpdate('crlv', e)} 
             />
          </label>
        </div>
      </div>
    </div>
  );

  const renderNotifications = () => {
     const Toggle = ({ active, onClick }: { active: boolean, onClick: () => void }) => (
        <button 
          onClick={onClick}
          className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 relative focus:outline-none ${active ? 'bg-green-500' : 'bg-gray-300'}`}
        >
           <div className={`w-5 h-5 bg-white rounded-full shadow-sm transform transition-transform duration-300 ${active ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
     );

     return (
        <div className="space-y-6 animate-fade-in">
           <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-red-50 p-2 rounded-lg"><Bell size={20} className="text-red-600"/></div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-sm">Novos Pedidos</h3>
                       <p className="text-xs text-gray-500">Alertas de novas corridas</p>
                    </div>
                 </div>
                 <Toggle active={notifSettings.newOrders} onClick={() => toggleNotification('newOrders')} />
              </div>

              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-blue-50 p-2 rounded-lg"><Volume2 size={20} className="text-blue-600"/></div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-sm">Sons do App</h3>
                       <p className="text-xs text-gray-500">Efeitos sonoros e alertas</p>
                    </div>
                 </div>
                 <Toggle active={notifSettings.sound} onClick={() => toggleNotification('sound')} />
              </div>

              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-purple-50 p-2 rounded-lg"><Zap size={20} className="text-purple-600"/></div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-sm">Vibração</h3>
                       <p className="text-xs text-gray-500">Vibrar ao receber chamados</p>
                    </div>
                 </div>
                 <Toggle active={notifSettings.vibration} onClick={() => toggleNotification('vibration')} />
              </div>

              <div className="p-4 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <div className="bg-yellow-50 p-2 rounded-lg"><Smartphone size={20} className="text-yellow-600"/></div>
                    <div>
                       <h3 className="font-bold text-gray-900 text-sm">Promoções</h3>
                       <p className="text-xs text-gray-500">Dicas e incentivos via Push</p>
                    </div>
                 </div>
                 <Toggle active={notifSettings.promotions} onClick={() => toggleNotification('promotions')} />
              </div>
           </div>
           
           <div className="p-4 bg-gray-100 rounded-xl flex gap-3 items-start">
              <AlertCircle size={20} className="text-gray-500 mt-0.5" />
              <p className="text-xs text-gray-500 leading-relaxed">
                 Para garantir que você receba todos os chamados, mantenha o aplicativo aberto em segundo plano e verifique se o modo "Não Perturbe" do celular está desativado.
              </p>
           </div>
        </div>
     );
  };

  const renderSupport = () => {
    const faqs = [
      {
        q: 'Como recebo meus repasses?',
        a: 'Os repasses são feitos semanalmente, toda quarta-feira, diretamente na Chave PIX cadastrada no seu perfil. Certifique-se de que seus dados estão corretos na aba Dados Pessoais.'
      },
      {
        q: 'O que fazer se o cliente não aparecer?',
        a: 'Aguarde 10 minutos no local. Após esse tempo, utilize o botão "Problemas na Entrega" no app para acionar o suporte e liberar a devolução do pedido à loja.'
      },
      {
        q: 'Como funciona o seguro acidentes?',
        a: 'Estamos em fase final de implementação do seguro parceiro com grandes seguradoras. Como somos uma plataforma em rápida expansão, estamos negociando as melhores apólices para proteger você. No momento, nossa Equipe de Resposta Rápida 24h está disponível para suporte imediato em qualquer incidente durante a rota.'
      },
      {
        q: 'Posso alterar meu veículo?',
        a: 'Sim, acesse a aba "Meus Veículos" no perfil para adicionar ou remover veículos. Lembre-se que para mudar de modal (ex: bike para moto), é necessário enviar a CNH correspondente.'
      }
    ];

    const shortcuts = [
      { label: 'Problema com Corrida', icon: Box, text: 'Olá, tive um problema com uma corrida recente. Detalhes: ' },
      { label: 'Problema com Pagamento', icon: CreditCard, text: 'Olá, tenho uma dúvida sobre meu repasse semanal. Detalhes: ' },
      { label: 'Problema com Cadastro', icon: FileText, text: 'Preciso atualizar meus documentos ou dados cadastrais. O problema é: ' },
      { label: 'Outros', icon: MoreHorizontal, text: '' },
    ];

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h3 className="font-bold text-gray-900">Perguntas Frequentes</h3>
          {faqs.map((item, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <button 
                onClick={() => toggleFaq(i)}
                className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
              >
                <span className="text-sm text-gray-700 font-medium">{item.q}</span>
                <ChevronRight 
                  size={16} 
                  className={`text-gray-400 transition-transform duration-300 ${activeFaq === i ? 'rotate-90' : ''}`} 
                />
              </button>
              {activeFaq === i && (
                <div className="p-4 pt-0 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 animate-fade-in leading-relaxed">
                   {item.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-100">
          <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
            <MessageSquare size={18} className="text-red-600"/> 
            Abrir Chamado
          </h3>

          <div className="grid grid-cols-2 gap-3 mb-4">
             {shortcuts.map((shortcut, idx) => (
                <button 
                  key={idx}
                  onClick={() => selectSupportShortcut(shortcut.text)}
                  className="p-3 bg-white border border-gray-200 rounded-xl flex flex-col items-center gap-2 hover:border-red-200 hover:bg-red-50 transition-all group shadow-sm"
                >
                   <div className="p-2 rounded-full bg-gray-50 group-hover:bg-white transition-colors">
                      <shortcut.icon size={20} className="text-gray-500 group-hover:text-red-600" />
                   </div>
                   <span className="text-[10px] font-bold text-gray-600 group-hover:text-red-700 text-center leading-tight">{shortcut.label}</span>
                </button>
             ))}
          </div>
          
          {supportSuccess ? (
             <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center animate-fade-in">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="text-green-600" size={24} />
                </div>
                <h3 className="font-bold text-green-900">Mensagem Enviada!</h3>
                <p className="text-sm text-green-700 mt-1">Nosso suporte entrará em contato em breve pelo email cadastrado.</p>
             </div>
          ) : (
            <form onSubmit={handleSupportSubmit} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu Nome</label>
                <input 
                  required
                  type="text" 
                  value={supportForm.name}
                  onChange={(e) => setSupportForm({...supportForm, name: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-transparent focus:bg-white focus:border-red-200 transition-all"
                  placeholder="Nome completo"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seu Email</label>
                <input 
                  required
                  type="email" 
                  value={supportForm.email}
                  onChange={(e) => setSupportForm({...supportForm, email: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-transparent focus:bg-white focus:border-red-200 transition-all"
                  placeholder="email@exemplo.com"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Mensagem</label>
                <textarea 
                  required
                  rows={4}
                  value={supportForm.message}
                  onChange={(e) => setSupportForm({...supportForm, message: e.target.value})}
                  className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-transparent focus:bg-white focus:border-red-200 transition-all resize-none"
                  placeholder="Selecione um atalho acima ou digite sua dúvida..."
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Anexo (Opcional)</label>
                {!supportFile ? (
                  <label className="flex items-center gap-2 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-lg cursor-pointer text-gray-500 hover:bg-gray-100 transition-all">
                    <Paperclip size={18} />
                    <span className="text-sm">Adicionar foto ou documento</span>
                    <input type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf" />
                  </label>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileText size={18} className="text-red-500 flex-shrink-0"/>
                      <span className="text-sm text-red-900 truncate">{supportFile.name}</span>
                    </div>
                    <button type="button" onClick={handleRemoveFile} className="text-red-400 hover:text-red-600">
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-100 hover:bg-red-700 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Send size={18} /> Enviar Mensagem
              </button>
            </form>
          )}
        </div>
      </div>
    );
  };

  if (view === 'menu') {
    return (
      <div className="p-4 pb-24 space-y-6 animate-fade-in font-sans flex flex-col min-h-screen bg-gray-50">
        <div className="flex items-center gap-3 mb-2">
            <button 
              onClick={handleBack}
              className="p-2 -ml-2 hover:bg-gray-200 rounded-full transition-colors text-gray-600"
            >
              <ChevronLeft size={24} />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Meu Perfil</h1>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center text-gray-500 border-2 border-white shadow-sm">
            <User size={32} />
          </div>
          <div>
            <h2 className="font-bold text-lg text-gray-900">{userData.name}</h2>
            <p className="text-sm text-gray-500">{userData.phone}</p>
            <div className="flex items-center gap-1 mt-1">
              <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-bold uppercase">Ouro</span>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <button onClick={() => setView('account')} className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-red-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition-colors"><Settings size={20} className="text-gray-600 group-hover:text-red-500"/></div>
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Dados Pessoais</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-red-300" />
          </button>

          <button onClick={() => setView('vehicles')} className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-red-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition-colors"><Bike size={20} className="text-gray-600 group-hover:text-red-500"/></div>
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Veículos</span>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[10px] text-gray-400 font-medium">{vehicles.length} cadastrados</span>
               <ChevronRight size={18} className="text-gray-300 group-hover:text-red-300" />
            </div>
          </button>

          <button onClick={() => setView('documents')} className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-red-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition-colors"><FileText size={20} className="text-gray-600 group-hover:text-red-500"/></div>
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Documentos</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${docStatus.cnh === 'reviewing' || docStatus.crlv === 'reviewing' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                {docStatus.cnh === 'reviewing' || docStatus.crlv === 'reviewing' ? 'Em Análise' : 'OK'}
              </span>
              <ChevronRight size={18} className="text-gray-300 group-hover:text-red-300" />
            </div>
          </button>

          <button onClick={() => setView('notifications')} className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-red-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition-colors"><Bell size={20} className="text-gray-600 group-hover:text-red-500"/></div>
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Notificações</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-red-300" />
          </button>

          <button onClick={() => setView('support')} className="w-full bg-white p-4 rounded-xl border border-gray-100 flex items-center justify-between group hover:border-red-200 hover:shadow-sm transition-all">
            <div className="flex items-center gap-3">
              <div className="bg-gray-50 p-2 rounded-lg group-hover:bg-red-50 transition-colors"><HelpCircle size={20} className="text-gray-600 group-hover:text-red-500"/></div>
              <span className="font-semibold text-gray-700 group-hover:text-red-600">Ajuda e Suporte</span>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-red-300" />
          </button>
        </div>

        <button onClick={onLogout} className="w-full mt-auto p-4 rounded-xl border border-gray-200 text-gray-500 font-bold flex items-center justify-center gap-2 hover:bg-gray-100 hover:text-gray-800 transition-colors">
          <LogOut size={18} /> Sair do App
        </button>
        <p className="text-center text-xs text-gray-300 mt-4">Versão 3.0.0 (Neo)</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      <div className="p-4 bg-white border-b border-gray-100 flex items-center sticky top-0 z-10">
        <button onClick={handleBack} className="mr-4 text-gray-600 hover:text-gray-900 p-1 rounded-full hover:bg-gray-100 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold text-gray-900">
          {view === 'account' && 'Dados Pessoais'}
          {view === 'vehicles' && 'Meus Veículos'}
          {view === 'documents' && 'Documentos'}
          {view === 'notifications' && 'Configurar Notificações'}
          {view === 'support' && 'Ajuda'}
        </h1>
      </div>
      
      <div className="flex-1 p-4 pb-24 overflow-y-auto">
        {view === 'account' && renderAccount()}
        {view === 'vehicles' && renderVehicles()}
        {view === 'documents' && renderDocuments()}
        {view === 'notifications' && renderNotifications()}
        {view === 'support' && renderSupport()}
      </div>
    </div>
  );
};

export default Profile;
