
import React, { useState, useEffect, useRef } from 'react';
import { Package, MapPin, Clock, Bike, Plus, LogOut, CheckCircle, Phone, MessageCircle, Navigation, X, Calculator, DollarSign, TrendingUp, ShieldCheck, CreditCard, Smartphone, Banknote, Layers, Search, Loader2, Power, Lock, Send, User, Home, Calendar, Store, PieChart as PieChartIcon, BarChart3, AlertTriangle, ArrowDownRight, ArrowUpRight, HelpCircle, FileText, ChevronRight, MessageSquare } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { ChatMessage } from '../types';

interface StorePanelProps {
  onLogout: () => void;
}

type OrderStatus = 'searching' | 'going_to_store' | 'at_store' | 'delivering' | 'completed';
type PaymentMethod = 'app' | 'money' | 'machine_debit' | 'machine_credit';
type RouteType = 'single' | 'double' | 'triple';

interface DeliveryInput {
  name: string;
  address: string;
}

const StorePanel: React.FC<StorePanelProps> = ({ onLogout }) => {
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'reports' | 'support'>('active');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  
  // Store Profile Data
  const [storeProfile, setStoreProfile] = useState({
     name: 'Minha Loja',
     logo: ''
  });

  // Detalhes do Histórico
  const [selectedHistoryOrder, setSelectedHistoryOrder] = useState<any>(null);
  
  // Chat State
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Estados do Formulário de Pedido
  const [deliveries, setDeliveries] = useState<DeliveryInput[]>([{ name: '', address: '' }]);
  const [distanceInput, setDistanceInput] = useState('');
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false); 

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('app');
  const [routeType, setRouteType] = useState<RouteType>('single');
  
  // Preços
  const [driverFee, setDriverFee] = useState(0);
  const [baseDriverFee, setBaseDriverFee] = useState(0);
  const [appliedMinFee, setAppliedMinFee] = useState(0);
  const [machineBonus, setMachineBonus] = useState(0);
  const [longDistanceBonus, setLongDistanceBonus] = useState(0);
  const [appFee, setAppFee] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  // Estado de Processamento de Pagamento
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  
  // Simulação de Estado do Pedido
  const [orderStatus, setOrderStatus] = useState<OrderStatus>('completed');
  const [pickupCode, setPickupCode] = useState<string>('');

  // SUPPORT STATE
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState('');
  const [supportSuccess, setSupportSuccess] = useState(false);
  
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // Load Store Data on Mount
  useEffect(() => {
     const savedStore = localStorage.getItem('neo_store_data');
     if (savedStore) {
        const parsed = JSON.parse(savedStore);
        setStoreProfile({
           name: parsed.name || 'Minha Loja',
           logo: parsed.logo || ''
        });
     }
  }, []);

  // Função para mudar o tipo de rota e ajustar os campos
  const handleRouteTypeChange = (type: RouteType) => {
    setRouteType(type);
    let count = 1;
    if (type === 'double') count = 2;
    if (type === 'triple') count = 3;

    setDeliveries(prev => {
      const newDeliveries = [...prev];
      // Adiciona campos se necessário
      while (newDeliveries.length < count) {
        newDeliveries.push({ name: '', address: '' });
      }
      // Remove campos se necessário
      return newDeliveries.slice(0, count);
    });
    
    // Reseta distância para forçar recálculo
    setDistanceInput('');
  };

  const handleDeliveryChange = (index: number, field: keyof DeliveryInput, value: string) => {
    const newDeliveries = [...deliveries];
    newDeliveries[index] = { ...newDeliveries[index], [field]: value };
    setDeliveries(newDeliveries);
  };

  // Atualizar preço
  useEffect(() => {
    const km = parseFloat(distanceInput);
    if (!isNaN(km) && km > 0) {
      let currentMinFee = 6.90; 
      if (routeType === 'double') currentMinFee = 10.50;
      if (routeType === 'triple') currentMinFee = 14.50;
      setAppliedMinFee(currentMinFee);

      let rawDriverCost = km * 1.30;
      const LONG_DIST_THRESHOLD = 8;
      const LONG_DIST_RATE = 0.25;
      let distBonus = 0;
      
      if (km > LONG_DIST_THRESHOLD) {
        const extraKm = km - LONG_DIST_THRESHOLD;
        distBonus = extraKm * LONG_DIST_RATE;
        rawDriverCost += distBonus; 
      }

      const finalBaseFee = Math.max(currentMinFee, rawDriverCost);
      const maqBonus = (paymentMethod === 'machine_credit' || paymentMethod === 'machine_debit') ? 2.00 : 0;
      
      const profitBase = 1.36;
      const kmStep = 4; 
      const multiplier = Math.max(1, Math.ceil(km / kmStep));
      let calculatedAppFee = profitBase * multiplier;

      if (routeType === 'triple') {
         calculatedAppFee += 1.00;
      }
      
      const finalDriverTotal = finalBaseFee + maqBonus;
      const finalTotal = finalDriverTotal + calculatedAppFee;

      setLongDistanceBonus(distBonus);
      setBaseDriverFee(finalBaseFee);
      setMachineBonus(maqBonus);
      setDriverFee(finalDriverTotal);
      setAppFee(calculatedAppFee);
      setTotalPrice(finalTotal);
    } else {
      setBaseDriverFee(0);
      setAppliedMinFee(0);
      setMachineBonus(0);
      setLongDistanceBonus(0);
      setDriverFee(0);
      setAppFee(0);
      setTotalPrice(0);
    }
  }, [distanceInput, paymentMethod, routeType]);

  // Simula ciclo do pedido
  useEffect(() => {
    if (activeTab !== 'active' || orderStatus === 'completed') return;

    let timeout: ReturnType<typeof setTimeout>;

    if (orderStatus === 'searching') {
      timeout = setTimeout(() => {
        setOrderStatus('going_to_store');
      }, 4000);
    } else {
      const interval = setInterval(() => {
        setOrderStatus((prev) => {
          if (prev === 'going_to_store') return 'at_store';
          if (prev === 'at_store') return 'delivering';
          if (prev === 'delivering') return 'completed';
          return 'completed';
        });
      }, 15000); 
      return () => clearInterval(interval);
    }

    return () => {
      if (timeout) clearTimeout(timeout);
    };
  }, [activeTab, orderStatus]);

  // Função para simular cálculo de distância ao sair do campo de endereço
  const handleAddressBlur = () => {
    // Verifica se todos os endereços estão preenchidos
    const allAddressesFilled = deliveries.every(d => d.address.trim().length > 0);
    
    if (allAddressesFilled && !distanceInput) {
       setIsCalculatingRoute(true);
       // Simula delay de API
       setTimeout(() => {
          const baseMin = routeType === 'single' ? 1.5 : routeType === 'double' ? 4.0 : 6.0;
          const range = 6.0;
          const mockDist = (baseMin + Math.random() * range).toFixed(1);
          
          setDistanceInput(mockDist);
          setIsCalculatingRoute(false);
       }, 1500);
    }
  };

  const handleRequestOrder = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Se for pagamento no app, simula processamento
    if (paymentMethod === 'app') {
       setIsProcessingPayment(true);
       setTimeout(() => {
          setIsProcessingPayment(false);
          dispatchOrder();
       }, 2000);
    } else {
       dispatchOrder();
    }
  };

  const dispatchOrder = () => {
    setShowNewOrderModal(false);
    
    // GERAÇÃO DE CÓDIGO ÚNICO DE 4 DÍGITOS (1000 a 9999)
    const newUniqueCode = Math.floor(1000 + Math.random() * 9000).toString();
    setPickupCode(newUniqueCode); 

    const orderCount = routeType === 'single' ? 1 : (routeType === 'double' ? 2 : 3);
    const subOrders = [];
    
    // Usa os dados digitados nos inputs
    for(let i=0; i<orderCount; i++) {
        subOrders.push({
            id: `#${Date.now()}-${i}`,
            restaurant: storeProfile.name,
            restaurantAddress: "Rua do Comércio, 123 - Centro",
            customerName: deliveries[i].name || `Cliente ${i+1}`,
            customerAddress: deliveries[i].address,
            items: [{ qtd: 1, name: 'Pedido Loja' }]
        });
    }

    const displayCustomerName = orderCount === 1 
        ? deliveries[0].name || "Cliente da Loja"
        : `${orderCount} Clientes (${deliveries.map(d => d.name.split(' ')[0] || 'Cliente').join(', ')})`;

    const displayAddress = orderCount === 1
        ? deliveries[0].address
        : `Rota com ${orderCount} paradas`;

    const newOrderPayload = {
        isTriggeredByStore: true,
        id: Date.now().toString(),
        restaurant: storeProfile.name,
        restaurantAddress: "Rua do Comércio, 123 - Centro",
        customerName: displayCustomerName,
        customerAddress: displayAddress,
        distance: `${distanceInput} km`,
        rawDistance: parseFloat(distanceInput),
        fee: `R$ ${driverFee.toFixed(2).replace('.', ',')}`, 
        rawFee: driverFee,
        estimatedTime: `${Math.round(parseFloat(distanceInput) * 3 + 10)} min`,
        paymentMethod: paymentMethod === 'app' ? 'Pago no App' : paymentMethod === 'money' ? 'Dinheiro' : (paymentMethod === 'machine_debit' ? 'Maq. Débito' : 'Maq. Crédito'),
        paymentType: paymentMethod,
        needsMachine: (paymentMethod === 'machine_credit' || paymentMethod === 'machine_debit'),
        machineBonus: machineBonus,
        isGrouped: routeType !== 'single',
        orderCount: orderCount,
        pickupCode: newUniqueCode, 
        subOrders: subOrders,
        isAppPayment: paymentMethod === 'app' 
    };

    // Salva na "Nuvem" simulada
    localStorage.setItem('neo_incoming_order', JSON.stringify(newOrderPayload));
    
    // Reset Form
    setDistanceInput('');
    setDeliveries([{ name: '', address: '' }]); // Reseta para 1
    setPaymentMethod('app');
    setRouteType('single');
    setActiveTab('active');
    setOrderStatus('searching');
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'me',
      text: newMessage,
      timestamp: new Date()
    };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');

    setTimeout(() => {
      const replies = ["Estou a caminho!", "Chego em 5 minutos.", "Qual é o código mesmo?", "Trânsito está intenso aqui.", "Ok, obrigado."];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      
      const replyMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'other',
        text: randomReply,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 2000);
  };

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newTicket = {
        id: Date.now().toString(),
        driverName: storeProfile.name, // Usando nome da loja como solicitante
        message: supportMessage,
        date: new Date().toISOString(),
        status: 'open',
        type: 'Suporte Loja'
    };
    
    const existingTickets = JSON.parse(localStorage.getItem('neo_support_tickets') || '[]');
    localStorage.setItem('neo_support_tickets', JSON.stringify([newTicket, ...existingTickets]));

    setSupportSuccess(true);
    setSupportMessage('');
    setTimeout(() => setSupportSuccess(false), 3000);
  };

  const toggleStoreStatus = () => {
    setIsStoreOpen(!isStoreOpen);
  };

  // MOCK DATA FOR REPORTS
  const REPORTS_DATA = [
    { name: 'Seg', success: 24, failed: 1 },
    { name: 'Ter', success: 18, failed: 0 },
    { name: 'Qua', success: 32, failed: 2 },
    { name: 'Qui', success: 28, failed: 1 },
    { name: 'Sex', success: 45, failed: 3 },
    { name: 'Sáb', success: 55, failed: 2 },
    { name: 'Dom', success: 30, failed: 0 },
  ];

  const RETURNS_REASONS_DATA = [
    { name: 'Cliente Ausente', value: 4, color: '#F87171' }, // Red-400
    { name: 'Endereço Incorreto', value: 3, color: '#FBBF24' }, // Amber-400
    { name: 'Cliente Recusou', value: 2, color: '#60A5FA' }, // Blue-400
  ];

  // Mock Data for History with specific details
  const HISTORY_MOCK = [
    { 
      id: 4501, 
      date: 'Ontem, 14:30', 
      driverName: 'João Souza', 
      driverBike: 'Honda CG 160', 
      driverPlate: 'ABC-1234',
      clientName: 'Maria Oliveira',
      clientAddress: 'Rua das Flores, 500',
      status: 'Entregue',
      amount: 'R$ 12,50'
    },
    { 
      id: 4502, 
      date: 'Ontem, 12:15', 
      driverName: 'Pedro Santos', 
      driverBike: 'Yamaha Fazer 250', 
      driverPlate: 'XYZ-9876',
      clientName: 'Roberto Almeida',
      clientAddress: 'Av. Paulista, 1200',
      status: 'Devolvido',
      amount: 'R$ 8,90'
    },
    { 
      id: 4503, 
      date: '25/10, 20:00', 
      driverName: 'Carlos Silva', 
      driverBike: 'Honda PCX', 
      driverPlate: 'NEO-2024',
      clientName: 'Fernanda Costa',
      clientAddress: 'Rua Augusta, 300',
      status: 'Entregue',
      amount: 'R$ 15,40'
    }
  ];

  const STORE_FAQS = [
    { q: 'O entregador não chegou, o que fazer?', a: 'Se o tempo estimado expirou, utilize o chat para contatar o motorista. Caso não tenha resposta em 10 minutos, abra um chamado aqui para cancelarmos e solicitarmos outro.' },
    { q: 'Como cancelar um pedido?', a: 'Pedidos em rota só podem ser cancelados via suporte. Se o entregador ainda não aceitou (status "Procurando"), você pode cancelar no histórico.' },
    { q: 'Quando recebo meus pagamentos?', a: 'Vendas via App são repassadas toda quarta-feira. Pagamentos em dinheiro ou maquininha própria são recebidos na hora.' },
    { q: 'O cliente informou endereço errado.', a: 'Avise o entregador pelo chat imediatamente. Se a distância for muito maior, o entregador pode solicitar uma taxa extra ou devolução.' },
  ];

  const getStatusInfo = () => {
    switch (orderStatus) {
      case 'searching': return { label: 'Procurando Entregadores...', color: 'text-gray-600', bg: 'bg-gray-100', step: 0 };
      case 'going_to_store': return { label: 'A caminho da coleta', color: 'text-blue-600', bg: 'bg-blue-50', step: 1 };
      case 'at_store': return { label: 'Entregador na loja', color: 'text-yellow-600', bg: 'bg-yellow-50', step: 2 };
      case 'delivering': return { label: 'Saiu para entrega', color: 'text-purple-600', bg: 'bg-purple-50', step: 3 };
      case 'completed': return { label: 'Pedido Entregue', color: 'text-green-600', bg: 'bg-green-50', step: 4 };
      default: return { label: 'Aguardando', color: 'text-gray-600', bg: 'bg-gray-50', step: 0 };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen shadow-2xl overflow-hidden relative flex flex-col">
        
        {/* Header da Loja */}
        <div className="bg-white p-5 shadow-sm border-b border-gray-100 flex justify-between items-center z-20">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-full bg-gray-100 border border-gray-200 overflow-hidden flex-shrink-0">
                {storeProfile.logo ? (
                   <img src={storeProfile.logo} alt="Logo Loja" className="w-full h-full object-cover" />
                ) : (
                   <div className="w-full h-full flex items-center justify-center text-gray-400"><Store size={20} /></div>
                )}
             </div>
             <div>
               <h1 className="text-lg font-bold text-gray-900 leading-tight max-w-[150px] truncate">{storeProfile.name}</h1>
               <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${isStoreOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <p className={`text-xs font-medium ${isStoreOpen ? 'text-green-600' : 'text-red-600'}`}>
                     {isStoreOpen ? 'Aberta' : 'Fechada'}
                  </p>
               </div>
             </div>
          </div>
          <div className="flex items-center gap-2">
             <button onClick={toggleStoreStatus} className={`flex items-center justify-center w-9 h-9 rounded-full transition-all border ${isStoreOpen ? 'bg-green-50 text-green-700 border-green-200 hover:bg-green-100' : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'}`}>
                <Power size={16} />
             </button>
             <button onClick={onLogout} className="flex items-center gap-1 px-3 py-2 bg-red-50 text-red-600 rounded-full font-bold text-xs hover:bg-red-100 transition-colors border border-red-100">
                <LogOut size={14} /> Sair
             </button>
          </div>
        </div>

        {/* Action Button (Only on Main Tabs) */}
        {activeTab !== 'support' && (
          <div className="p-4 bg-white z-10">
             <button 
               onClick={() => setShowNewOrderModal(true)}
               disabled={!isStoreOpen}
               className={`w-full py-4 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all transform active:scale-95 ${
                  isStoreOpen ? 'bg-red-600 text-white shadow-red-200 hover:bg-red-700' : 'bg-gray-200 text-gray-500 cursor-not-allowed shadow-none'
               }`}
             >
                {isStoreOpen ? <Plus size={20} /> : <Lock size={20} />}
                {isStoreOpen ? 'Solicitar Novo Entregador' : 'Loja Fechada'}
             </button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-4 border-b border-gray-200 bg-white z-10">
          <button onClick={() => setActiveTab('active')} className={`flex-1 py-3 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'active' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
            Rastreamento ({orderStatus === 'completed' ? 0 : 1})
          </button>
          <button onClick={() => setActiveTab('history')} className={`flex-1 py-3 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors ${activeTab === 'history' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
            Histórico
          </button>
          <button onClick={() => setActiveTab('reports')} className={`flex-1 py-3 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'reports' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
            <BarChart3 size={14} /> Relatórios
          </button>
          <button onClick={() => setActiveTab('support')} className={`flex-1 py-3 text-xs sm:text-sm font-medium text-center border-b-2 transition-colors flex items-center justify-center gap-1 ${activeTab === 'support' ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500'}`}>
            <HelpCircle size={14} /> Ajuda
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-4 overflow-y-auto pb-10">
          
          {/* TAB: SUPPORT */}
          {activeTab === 'support' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3">
                   <HelpCircle className="text-blue-600 shrink-0" size={20} />
                   <div>
                      <h3 className="font-bold text-blue-900 text-sm">Central de Ajuda</h3>
                      <p className="text-xs text-blue-700 mt-1">Tire suas dúvidas ou fale com nosso time de suporte parceiro.</p>
                   </div>
                </div>

                {/* FAQ */}
                <div className="space-y-2">
                   <h3 className="font-bold text-gray-900 text-sm mb-2">Dúvidas Comuns</h3>
                   {STORE_FAQS.map((faq, idx) => (
                      <div key={idx} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                         <button 
                           onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                           className="w-full p-4 flex justify-between items-center hover:bg-gray-50 transition-colors text-left"
                         >
                            <span className="text-xs font-bold text-gray-700">{faq.q}</span>
                            <ChevronRight size={14} className={`text-gray-400 transition-transform ${activeFaq === idx ? 'rotate-90' : ''}`} />
                         </button>
                         {activeFaq === idx && (
                            <div className="p-4 pt-0 text-xs text-gray-500 bg-gray-50 border-t border-gray-100 leading-relaxed">
                               {faq.a}
                            </div>
                         )}
                      </div>
                   ))}
                </div>

                {/* Form */}
                <div className="pt-4 border-t border-gray-100">
                   <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                      <MessageSquare size={16} className="text-red-600"/> Abrir Chamado
                   </h3>
                   
                   {supportSuccess ? (
                      <div className="bg-green-50 border border-green-100 p-6 rounded-xl text-center animate-fade-in">
                         <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                           <CheckCircle className="text-green-600" size={20} />
                         </div>
                         <h3 className="font-bold text-green-900 text-sm">Recebemos sua mensagem!</h3>
                         <p className="text-xs text-green-700 mt-1">Em breve entraremos em contato pelo email da loja.</p>
                      </div>
                   ) : (
                      <form onSubmit={handleSupportSubmit} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 space-y-3">
                         <div className="flex gap-2 mb-2">
                            <button type="button" onClick={() => setSupportMessage('Entregador não apareceu para coleta.')} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-200 transition-colors">Entregador sumiu</button>
                            <button type="button" onClick={() => setSupportMessage('Tive um problema com o pagamento.')} className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-lg text-[10px] font-bold text-gray-600 border border-gray-200 transition-colors">Problema Pagamento</button>
                         </div>
                         <textarea 
                           required
                           value={supportMessage}
                           onChange={(e) => setSupportMessage(e.target.value)}
                           placeholder="Descreva seu problema..."
                           className="w-full p-3 bg-gray-50 rounded-lg outline-none border border-transparent focus:bg-white focus:border-red-200 transition-all text-sm resize-none h-24"
                         ></textarea>
                         <button 
                           type="submit"
                           className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold text-sm hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                         >
                            <Send size={14} /> Enviar para o Admin
                         </button>
                      </form>
                   )}
                </div>
             </div>
          )}

          {/* TAB: REPORT DASHBOARD */}
          {activeTab === 'reports' && (
             <div className="space-y-6 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                   <h2 className="text-lg font-bold text-gray-900">Performance da Semana</h2>
                   <span className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full font-bold">Últimos 7 dias</span>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                      <p className="text-xs text-gray-400 uppercase font-bold mb-1">Entregas Totais</p>
                      <p className="text-2xl font-black text-gray-900">241</p>
                      <p className="text-[10px] text-green-600 flex items-center gap-1 mt-1"><ArrowUpRight size={10}/> +12% vs semana passada</p>
                   </div>
                   <div className="bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                      <p className="text-xs text-red-700 uppercase font-bold mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Devoluções</p>
                      <p className="text-2xl font-black text-red-600">9</p>
                      <p className="text-[10px] text-red-500 mt-1">Taxa de Falha: 3.7%</p>
                   </div>
                </div>

                {/* Bar Chart: Success vs Returns */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                   <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-gray-400"/> Entregas vs Devoluções</h3>
                   <div className="h-48 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                         <BarChart data={REPORTS_DATA}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#9ca3af'}} />
                            <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                            <Legend iconType="circle" wrapperStyle={{fontSize: '10px', paddingTop: '10px'}} />
                            <Bar dataKey="success" name="Entregues" fill="#22c55e" radius={[4, 4, 0, 0]} stackId="a" />
                            <Bar dataKey="failed" name="Devoluções" fill="#ef4444" radius={[4, 4, 0, 0]} stackId="a" />
                         </BarChart>
                      </ResponsiveContainer>
                   </div>
                </div>

                {/* Pie Chart: Reasons */}
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
                   <h3 className="font-bold text-gray-900 text-sm mb-2">Motivos de Devolução</h3>
                   <div className="flex items-center">
                      <div className="h-32 w-32 relative">
                         <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                               <Pie
                                  data={RETURNS_REASONS_DATA}
                                  innerRadius={35}
                                  outerRadius={55}
                                  paddingAngle={5}
                                  dataKey="value"
                               >
                                  {RETURNS_REASONS_DATA.map((entry, index) => (
                                     <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                               </Pie>
                            </PieChart>
                         </ResponsiveContainer>
                         <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
                            <span className="text-xs font-bold text-gray-400">Total</span>
                            <p className="text-lg font-black text-gray-900 leading-none">9</p>
                         </div>
                      </div>
                      <div className="flex-1 pl-4 space-y-2">
                         {RETURNS_REASONS_DATA.map((reason, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                               <div className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: reason.color }}></div>
                                  <span className="text-gray-600">{reason.name}</span>
                               </div>
                               <span className="font-bold text-gray-900">{reason.value}</span>
                            </div>
                         ))}
                      </div>
                   </div>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                   <div className="bg-blue-100 p-2 rounded-lg h-fit text-blue-600"><Banknote size={20} /></div>
                   <div>
                      <p className="text-xs font-bold text-blue-800 uppercase mb-1">Custo de Retorno</p>
                      <p className="text-sm text-blue-700 leading-relaxed">
                         Você gastou <span className="font-bold">R$ 18,00</span> em taxas de devolução nesta semana (+R$ 2,00 por retorno).
                      </p>
                   </div>
                </div>
             </div>
          )}

          {/* TAB: ACTIVE TRACKING */}
          {activeTab === 'active' && orderStatus !== 'completed' && (
            <div className="space-y-4 animate-fade-in">
              {/* Pickup Code Display for Store */}
              {orderStatus !== 'searching' && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden animate-slide-up">
                   <div className="relative z-10">
                      <p className="text-xs text-yellow-800 font-bold uppercase mb-1">Código de Coleta</p>
                      <p className="text-xs text-yellow-700 max-w-[180px] leading-tight">Peça este código ao motorista para confirmar a entrega do pacote.</p>
                   </div>
                   <div className="relative z-10 bg-white px-4 py-2 rounded-lg border-2 border-yellow-400 shadow-sm">
                      <span className="text-3xl font-mono font-black text-gray-900 tracking-widest">{pickupCode}</span>
                   </div>
                </div>
              )}

              {/* Status Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className={`p-4 border-b border-gray-50 ${statusInfo.bg}`}>
                   <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold uppercase px-2 py-1 rounded-full bg-white/50 flex items-center gap-2 ${statusInfo.color}`}>
                        {orderStatus === 'searching' && <Loader2 size={12} className="animate-spin"/>}
                        {statusInfo.label}
                      </span>
                      <span className="text-xs font-medium text-gray-500 flex items-center gap-1">
                         <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Tempo Real
                      </span>
                   </div>
                   {/* Stepper */}
                   <div className="flex items-center justify-between mt-4 relative">
                      <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-200 -z-10 transform -translate-y-1/2 rounded-full"></div>
                      <div className="absolute top-1/2 left-0 h-1 bg-green-500 -z-10 transform -translate-y-1/2 rounded-full transition-all duration-1000" style={{ width: `${(statusInfo.step / 4) * 100}%` }}></div>
                      {[1, 2, 3, 4].map((step) => (
                        <div key={step} className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold border-2 transition-colors duration-500 ${step <= statusInfo.step ? 'bg-green-500 border-green-500 text-white' : 'bg-white border-gray-300 text-gray-400'}`}>
                          {step < statusInfo.step ? <CheckCircle size={12} /> : step}
                        </div>
                      ))}
                   </div>
                </div>

                {/* Enhanced Real-Time Map */}
                <div className="h-72 bg-gray-100 relative overflow-hidden group border-b border-gray-200">
                   {/* Grid Pattern */}
                   <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#cbd5e1 1px, transparent 1px), linear-gradient(90deg, #cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                   
                   {/* Routes SVG */}
                   <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
                      {/* Line 1: Driver Start -> Store (Blue) - Only visible if going to store */}
                      <line x1="10%" y1="10%" x2="50%" y2="50%" stroke="#3B82F6" strokeWidth="3" strokeDasharray="5 5" className="opacity-50" />
                      
                      {/* Line 2: Store -> Customer (Red) */}
                      <line x1="50%" y1="50%" x2="90%" y2="80%" stroke="#EA1D2C" strokeWidth="4" strokeLinecap="round" />
                   </svg>

                   {/* Store Pin (Fixed Center) */}
                   <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className="w-8 h-8 bg-white rounded-full border-2 border-gray-800 shadow-lg flex items-center justify-center z-20"><StoreIcon /></div>
                      <span className="text-[10px] font-bold bg-gray-800 text-white px-2 py-0.5 rounded mt-1 shadow-sm z-20">Loja</span>
                   </div>

                   {/* Customer Pin (Fixed Destination) */}
                   <div className="absolute top-[80%] left-[90%] transform -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                      <div className="w-8 h-8 bg-red-100 rounded-full border-2 border-red-500 shadow-lg flex items-center justify-center"><User size={16} className="text-red-600" /></div>
                      <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded mt-1 shadow-sm border border-gray-200">Cliente</span>
                   </div>

                   {/* Driver Pin (Moving) */}
                   {orderStatus !== 'searching' && (
                     <div 
                        className="absolute z-30 flex flex-col items-center transition-all duration-[2000ms] ease-linear"
                        style={{
                           top: orderStatus === 'going_to_store' ? '30%' : orderStatus === 'at_store' ? '50%' : orderStatus === 'delivering' ? '65%' : '80%',
                           left: orderStatus === 'going_to_store' ? '30%' : orderStatus === 'at_store' ? '50%' : orderStatus === 'delivering' ? '70%' : '90%',
                           transform: 'translate(-50%, -50%)'
                        }}
                     >
                        <div className="w-12 h-12 bg-gray-900 rounded-full border-[3px] border-white shadow-xl flex items-center justify-center relative">
                           <Bike size={20} className="text-white" />
                           <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-white animate-pulse"></div>
                        </div>
                        <div className="bg-white/90 backdrop-blur px-2 py-1 rounded-md shadow-sm mt-1 border border-gray-200 text-center">
                           <p className="text-[10px] font-bold text-gray-900 leading-none">Carlos S.</p>
                           <p className="text-[8px] text-gray-500">Honda CG</p>
                        </div>
                     </div>
                   )}

                   {/* Searching Overlay */}
                   {orderStatus === 'searching' && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-[2px] z-40">
                         <div className="bg-white px-4 py-2 rounded-full shadow-lg border border-gray-100 flex items-center gap-3">
                            <Loader2 size={18} className="animate-spin text-red-600"/> 
                            <span className="text-xs font-bold text-gray-600">Localizando parceiro próximo...</span>
                         </div>
                         <div className="mt-8 w-64 h-64 border border-red-500/20 rounded-full animate-ping absolute"></div>
                      </div>
                   )}
                </div>

                {/* Driver Info Footer */}
                {orderStatus !== 'searching' && (
                  <div className="p-4 animate-slide-up bg-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden ring-2 ring-gray-50">
                          <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop" alt="Driver" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-gray-900">Carlos Silva</h3>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1"><Bike size={12}/> Honda CG 160</span>
                              <span>•</span><span className="font-medium text-gray-900">ABC-1234</span>
                          </div>
                        </div>
                        <div className="text-right">
                           <div className="text-xs font-bold bg-green-100 text-green-800 px-2 py-1 rounded-full">4.9 ★</div>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={() => setShowChat(true)} className="flex-1 bg-green-50 text-green-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-green-100 transition-colors border border-green-200 relative">
                           <MessageCircle size={18} /> Chat
                           {chatMessages.length > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></span>}
                        </button>
                        <button className="flex-1 bg-gray-50 text-gray-700 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition-colors border border-gray-200"><Phone size={18} /> Ligar</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )} 
          
          {/* TAB: ACTIVE EMPTY STATE */}
          {activeTab === 'active' && orderStatus === 'completed' && (
             <div className="flex flex-col items-center justify-center h-64 text-center animate-fade-in">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4"><Package className="text-gray-400" size={32} /></div>
                <h3 className="font-bold text-gray-900 mb-1">Sem entregas ativas</h3>
                <p className="text-sm text-gray-500 mb-6">Solicite um entregador para começar.</p>
             </div>
          )}

          {/* TAB: HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-3 animate-fade-in">
               {HISTORY_MOCK.map((order) => (
                  <button 
                    key={order.id} 
                    onClick={() => setSelectedHistoryOrder(order)}
                    className={`w-full bg-white p-4 rounded-xl border shadow-sm flex justify-between items-center hover:bg-gray-50 transition-all text-left group ${order.status === 'Devolvido' ? 'border-red-100 bg-red-50/50' : 'border-gray-100'}`}
                  >
                     <div>
                       <p className={`font-bold text-sm transition-colors ${order.status === 'Devolvido' ? 'text-red-800' : 'text-gray-900 group-hover:text-red-600'}`}>Pedido #{order.id}</p>
                       <p className="text-xs text-gray-500">{order.date} • Entregue por {order.driverName.split(' ')[0]}</p>
                     </div>
                     <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-lg ${order.status === 'Devolvido' ? 'bg-red-100 text-red-700' : 'bg-green-50 text-green-600'}`}>
                        {order.status === 'Devolvido' ? <AlertTriangle size={14}/> : <CheckCircle size={14} />} {order.status}
                     </div>
                  </button>
               ))}
            </div>
          )}
        </div>
        
        {/* MODAL DE NOVA ENTREGA */}
        {showNewOrderModal && (
          <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in">
             <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl max-h-[95vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                   <h2 className="text-xl font-bold text-gray-900">Nova Entrega</h2>
                   <button onClick={() => setShowNewOrderModal(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-500" /></button>
                </div>
                
                <form onSubmit={handleRequestOrder} className="space-y-4">
                   
                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Tipo de Rota</label>
                      <div className="flex gap-2">
                         <button type="button" onClick={() => handleRouteTypeChange('single')} className={`flex-1 p-2 rounded-lg border-2 text-center transition-all ${routeType === 'single' ? 'border-gray-600 bg-gray-100 text-gray-900' : 'border-gray-100 bg-white text-gray-500'}`}><span className="block text-xs font-bold">Simples</span></button>
                         <button type="button" onClick={() => handleRouteTypeChange('double')} className={`flex-1 p-2 rounded-lg border-2 text-center transition-all ${routeType === 'double' ? 'border-purple-600 bg-purple-50 text-purple-900' : 'border-gray-100 bg-white text-gray-500'}`}><span className="block text-xs font-bold">Dupla</span></button>
                         <button type="button" onClick={() => handleRouteTypeChange('triple')} className={`flex-1 p-2 rounded-lg border-2 text-center transition-all ${routeType === 'triple' ? 'border-indigo-600 bg-indigo-50 text-indigo-900' : 'border-gray-100 bg-white text-gray-500'}`}><span className="block text-xs font-bold">Tripla</span></button>
                      </div>
                   </div>

                   {/* CAMPOS DE ENDEREÇO DINÂMICOS */}
                   <div className="space-y-4 max-h-[30vh] overflow-y-auto pr-1">
                      {deliveries.map((delivery, index) => (
                        <div key={index} className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                           <div className="flex items-center gap-2 mb-3">
                              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${index === 0 ? 'bg-gray-900' : index === 1 ? 'bg-purple-600' : 'bg-indigo-600'}`}>
                                 {index + 1}
                              </div>
                              <span className="text-xs font-bold uppercase text-gray-500">Entrega #{index + 1}</span>
                           </div>

                           <div className="space-y-3">
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Nome do Cliente</label>
                                 <div className="relative">
                                    <User className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input 
                                      required
                                      type="text" 
                                      placeholder={`Cliente ${index + 1}`} 
                                      value={delivery.name} 
                                      onChange={(e) => handleDeliveryChange(index, 'name', e.target.value)} 
                                      className="w-full p-2 pl-9 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                                    />
                                 </div>
                              </div>
                              <div>
                                 <label className="block text-[10px] font-bold text-gray-400 uppercase mb-1">Endereço</label>
                                 <div className="relative">
                                    <MapPin className="absolute left-3 top-2.5 text-gray-400" size={16} />
                                    <input 
                                      required
                                      type="text" 
                                      placeholder="Endereço completo" 
                                      value={delivery.address} 
                                      onChange={(e) => handleDeliveryChange(index, 'address', e.target.value)}
                                      onBlur={handleAddressBlur} 
                                      className="w-full p-2 pl-9 bg-white rounded-lg border border-gray-200 focus:ring-2 focus:ring-red-500 outline-none text-sm" 
                                    />
                                 </div>
                              </div>
                           </div>
                        </div>
                      ))}
                   </div>

                   <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Pagamento</label>
                      <div className="grid grid-cols-2 gap-3">
                        <button type="button" onClick={() => setPaymentMethod('app')} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === 'app' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-50'}`}>
                          <Smartphone size={24} className="mb-2" />
                          <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">Digital</div>
                          <div className="font-bold leading-none">Pago no App</div>
                        </button>

                        <button type="button" onClick={() => setPaymentMethod('money')} className={`p-4 rounded-xl border-2 text-left transition-all ${paymentMethod === 'money' ? 'border-green-600 bg-green-50 text-green-700' : 'border-gray-100 bg-gray-50 text-gray-600 hover:bg-gray-50'}`}>
                          <Banknote size={24} className="mb-2" />
                          <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">Manual</div>
                          <div className="font-bold leading-none">Dinheiro</div>
                        </button>

                        {/* Maq. Débito */}
                        <button type="button" onClick={() => setPaymentMethod('machine_debit')} className={`relative overflow-hidden p-4 rounded-xl border-2 text-left transition-all group ${paymentMethod === 'machine_debit' ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-blue-300'}`}>
                           <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">+ R$ 2,00</div>
                           <div className="flex flex-col h-full justify-between relative z-0">
                              <CreditCard size={24} className="mb-2 text-blue-500" />
                              <div>
                                 <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">Máquina</div>
                                 <div className="font-bold leading-none">Débito</div>
                              </div>
                           </div>
                        </button>

                        {/* Maq. Crédito */}
                        <button type="button" onClick={() => setPaymentMethod('machine_credit')} className={`relative overflow-hidden p-4 rounded-xl border-2 text-left transition-all group ${paymentMethod === 'machine_credit' ? 'border-purple-600 bg-purple-50 text-purple-700' : 'border-gray-200 bg-white text-gray-600 hover:border-purple-300'}`}>
                           <div className="absolute top-0 right-0 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-sm z-10">+ R$ 2,00</div>
                           <div className="flex flex-col h-full justify-between relative z-0">
                              <CreditCard size={24} className="mb-2 text-purple-500" />
                              <div>
                                 <div className="text-xs font-bold uppercase tracking-wider opacity-70 mb-0.5">Máquina</div>
                                 <div className="font-bold leading-none">Crédito</div>
                              </div>
                           </div>
                        </button>
                      </div>
                   </div>

                   {/* SIMULAÇÃO DE PREÇO E DISTÂNCIA */}
                   <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3">
                      <div className="flex justify-between items-center">
                         <h3 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1"><Calculator size={14} /> Simulação</h3>
                         
                         {/* Mostra distância calculada aqui */}
                         {isCalculatingRoute ? (
                            <span className="text-xs text-blue-600 flex items-center gap-1"><Loader2 size={12} className="animate-spin"/> Calculando rota...</span>
                         ) : distanceInput ? (
                            <span className="text-xs font-bold text-gray-700 bg-white px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                               <Navigation size={12}/> {distanceInput} km
                            </span>
                         ) : null}
                      </div>

                      <div className="pt-2 flex justify-between items-end border-t border-gray-200">
                         <span className="text-sm font-bold text-gray-900">Total a Pagar</span>
                         <span className="text-2xl font-black text-gray-900">R$ {totalPrice.toFixed(2)}</span>
                      </div>
                   </div>

                   <button 
                     disabled={!distanceInput || isProcessingPayment || deliveries.some(d => !d.address)}
                     type="submit" 
                     className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                   >
                      {isProcessingPayment ? <Loader2 className="animate-spin" size={20} /> : <CheckCircle size={20} />} 
                      {isProcessingPayment ? 'Processando Pagamento...' : (paymentMethod === 'app' ? 'Pagar e Solicitar' : 'Confirmar Solicitação')}
                   </button>
                </form>
             </div>
          </div>
        )}

        {/* MODAL DE DETALHES DO HISTÓRICO */}
        {selectedHistoryOrder && (
           <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-fade-in" onClick={() => setSelectedHistoryOrder(null)}>
              <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
                 <div className="flex justify-between items-center mb-6">
                    <div>
                       <h2 className="text-lg font-bold text-gray-900">Detalhes do Pedido</h2>
                       <p className="text-xs text-gray-500">ID #{selectedHistoryOrder.id}</p>
                    </div>
                    <button onClick={() => setSelectedHistoryOrder(null)} className="p-2 hover:bg-gray-100 rounded-full"><X size={24} className="text-gray-500" /></button>
                 </div>

                 <div className="space-y-6 max-h-[70vh] overflow-y-auto">
                    {/* Status Badge */}
                    <div className={`border p-4 rounded-xl flex items-center gap-3 ${selectedHistoryOrder.status === 'Devolvido' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                       {selectedHistoryOrder.status === 'Devolvido' ? <AlertTriangle className="text-red-600" size={24}/> : <CheckCircle className="text-green-600" size={24} />}
                       <div>
                          <p className={`text-sm font-bold ${selectedHistoryOrder.status === 'Devolvido' ? 'text-red-900' : 'text-green-900'}`}>
                             {selectedHistoryOrder.status === 'Devolvido' ? 'Entrega Mal Sucedida' : 'Entrega Finalizada'}
                          </p>
                          <p className={`text-xs ${selectedHistoryOrder.status === 'Devolvido' ? 'text-red-700' : 'text-green-700'}`}>{selectedHistoryOrder.date}</p>
                       </div>
                    </div>

                    {/* Items Detail (New Section) */}
                    {selectedHistoryOrder.items && selectedHistoryOrder.items.length > 0 && (
                       <div>
                          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Itens do Pedido</h3>
                          <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-2">
                             {selectedHistoryOrder.items.map((item: any, idx: number) => (
                                <div key={idx} className="flex justify-between items-center text-sm">
                                   <span className="text-gray-700 font-medium">{item.qtd}x {item.name}</span>
                                </div>
                             ))}
                          </div>
                       </div>
                    )}

                    {/* Driver Info */}
                    <div>
                       <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Entregue Por</h3>
                       <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                             <User size={20} className="text-gray-500" />
                          </div>
                          <div>
                             <p className="font-bold text-gray-900 text-sm">{selectedHistoryOrder.driverName}</p>
                             <p className="text-xs text-gray-500">{selectedHistoryOrder.driverBike} • {selectedHistoryOrder.driverPlate}</p>
                          </div>
                       </div>
                    </div>

                    {/* Client Info */}
                    <div>
                       <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">Dados do Cliente</h3>
                       <div className="space-y-3">
                          <div className="flex items-start gap-3">
                             <User size={18} className="text-red-500 mt-0.5" />
                             <div>
                                <p className="text-xs text-gray-500 font-medium">Nome</p>
                                <p className="text-sm font-bold text-gray-900">{selectedHistoryOrder.clientName}</p>
                             </div>
                          </div>
                          <div className="flex items-start gap-3">
                             <MapPin size={18} className="text-red-500 mt-0.5" />
                             <div>
                                <p className="text-xs text-gray-500 font-medium">Endereço</p>
                                <p className="text-sm font-bold text-gray-900">{selectedHistoryOrder.clientAddress}</p>
                             </div>
                          </div>
                       </div>
                    </div>

                    {/* Finance Info */}
                    <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
                       <span className="text-sm font-medium text-gray-500">Valor Pago</span>
                       <span className="text-xl font-bold text-gray-900">{selectedHistoryOrder.amount}</span>
                    </div>
                 </div>

                 <button onClick={() => setSelectedHistoryOrder(null)} className="w-full mt-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                    Fechar
                 </button>
              </div>
           </div>
        )}

        {/* MODAL DE CHAT */}
        {showChat && (
           <div className="absolute inset-0 z-50 bg-white flex flex-col animate-fade-in">
              <div className="bg-green-600 p-4 flex items-center gap-3 text-white shadow-md">
                 <button onClick={() => setShowChat(false)} className="p-1 hover:bg-green-700 rounded-full"><X size={24} /></button>
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-gray-200 overflow-hidden border border-white">
                        <img src="https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop" alt="Driver" className="w-full h-full object-cover" />
                    </div>
                    <div>
                       <h3 className="font-bold text-sm leading-tight">Carlos Silva</h3>
                       <p className="text-[10px] text-green-100">Entregador</p>
                    </div>
                 </div>
              </div>
              <div className="flex-1 bg-[#efeae2] p-4 overflow-y-auto space-y-3">
                 {chatMessages.length === 0 && (
                    <div className="text-center text-xs text-gray-400 my-4 bg-white/50 p-2 rounded-full mx-auto w-fit">
                       Fale com o entregador aqui
                    </div>
                 )}
                 {chatMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}>
                       <div className={`max-w-[80%] p-3 rounded-lg shadow-sm text-sm ${msg.sender === 'me' ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' : 'bg-white text-gray-900 rounded-tl-none'}`}>
                          <p>{msg.text}</p>
                          <span className="text-[10px] text-gray-400 block text-right mt-1">
                             {msg.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                       </div>
                    </div>
                 ))}
                 <div ref={chatEndRef} />
              </div>
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
                 <input autoFocus type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 p-3 bg-gray-100 rounded-full outline-none focus:ring-1 focus:ring-green-500 transition-all" />
                 <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"><Send size={20} /></button>
              </form>
           </div>
        )}

      </div>
    </div>
  );
};

const StoreIcon = () => (
   <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1f2937" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
)

export default StorePanel;
