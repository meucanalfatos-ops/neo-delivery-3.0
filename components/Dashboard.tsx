
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Power, Navigation, Store, Bell, Bike, Volume2, Phone, MessageCircle, CreditCard, CheckCircle, Plus, Minus, Crosshair, Gem, Trophy, Award, Menu, RotateCcw, TrendingUp, Clock, Send, X, Map, AlertTriangle, HelpCircle, Timer, DollarSign, Package, Compass, Zap, ThumbsUp, User, ShieldAlert, CloudSun, Lock, XCircle, BarChart2, ShieldCheck, Smartphone, MapPin } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generateSpeech } from '../services/geminiService';
import { MOCK_STATS, MOCK_STORES, WEEKLY_DATA } from '../constants';
import { DriverLevel, ChatMessage, View } from '../types';
import GoogleMapIntegration from './GoogleMapIntegration';

type OrderStep = 'idle' | 'offering' | 'going_to_store' | 'at_store' | 'delivering' | 'at_customer' | 'returning_machine' | 'completed';

interface SubOrder {
  id: string;
  restaurant: string;
  restaurantAddress: string;
  customerName: string;
  customerAddress: string;
  items: { qtd: number; name: string }[];
}

interface DashboardProps {
  onOpenSidebar?: () => void;
  onNavigate?: (view: View) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ onOpenSidebar, onNavigate }) => {
  const [isOnline, setIsOnline] = useState(false);
  const [orderStep, setOrderStep] = useState<OrderStep>('idle');
  const [offerTimer, setOfferTimer] = useState(15);
  const [arrivalTimer, setArrivalTimer] = useState(11 * 60);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [waitingForCustomer, setWaitingForCustomer] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showChart, setShowChart] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [mockOrder, setMockOrder] = useState<any>(null);
  
  // Profile Photo State
  const [userPhoto, setUserPhoto] = useState('https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=100&h=100&fit=crop');

  // Daily Stats State
  const [dailyEarnings, setDailyEarnings] = useState(142.50);
  const [dailyAccepted, setDailyAccepted] = useState(12);
  const [dailyRejected, setDailyRejected] = useState(2);

  // Simulação de Geolocalização do Entregador (Centro: Av. Paulista/Masp)
  const [driverLocation, setDriverLocation] = useState({ lat: -23.561684, lng: -46.655981 });

  const generateRandomOrder = () => {
    const rand = Math.random();
    let orderCount = 1;
    if (rand > 0.7) orderCount = 2;
    if (rand > 0.9) orderCount = 3;

    const isGrouped = orderCount > 1;
    
    const randomStoreIndex = Math.floor(Math.random() * MOCK_STORES.length);
    const selectedRestaurant = MOCK_STORES[randomStoreIndex];
    
    // Simulação de Destinos (com coordenadas próximas para o mapa funcionar)
    const possibleCustomers = [
        { name: 'Juliana Martins', address: 'Rua Augusta, 1500', lat: -23.5531, lng: -46.6587 },
        { name: 'Roberto Carlos', address: 'Al. Santos, 800', lat: -23.5689, lng: -46.6521 },
        { name: 'Ana Pereira', address: 'Rua Frei Caneca, 300', lat: -23.5528, lng: -46.6501 },
        { name: 'Marcos Souza', address: 'Rua da Consolação, 900', lat: -23.5491, lng: -46.6452 }
    ];
    const shuffledCustomers = possibleCustomers.sort(() => 0.5 - Math.random());

    const subOrders: SubOrder[] = [];
    let totalDistanceVal = 0;
    
    let baseFee = 6.90; 
    if (orderCount === 2) baseFee = 10.50; 
    if (orderCount === 3) baseFee = 14.50; 

    for (let i = 0; i < orderCount; i++) {
        const customer = shuffledCustomers[i];
        const legDistance = 1.5 + (Math.random() * 3); 
        totalDistanceVal += legDistance;
        subOrders.push({
            id: `#${Math.floor(1000 + Math.random() * 9000)}`,
            restaurant: selectedRestaurant.name,
            restaurantAddress: selectedRestaurant.address,
            customerName: customer.name,
            customerAddress: customer.address,
            items: [{ qtd: 1, name: 'Combo Padrão' }]
        });
    }

    const distanceCost = totalDistanceVal * 1.30;
    let totalFeeVal = Math.max(baseFee, distanceCost);
    const needsMachine = Math.random() > 0.7;
    const machineBonus = needsMachine ? 2.00 : 0;
    const estimatedMinutes = Math.round((totalDistanceVal * 2.5) + 5 + (3 * orderCount));
    const manualPickupCode = Math.floor(1000 + Math.random() * 9000).toString();

    return {
        isGrouped,
        orderCount,
        subOrders,
        id: subOrders[0].id,
        pickupCode: manualPickupCode,
        restaurant: orderCount > 1 ? `${selectedRestaurant.name} (${orderCount} Pedidos)` : selectedRestaurant.name,
        restaurantAddress: selectedRestaurant.address,
        customerName: orderCount > 1 ? `${orderCount} Clientes` : subOrders[0].customerName,
        customerAddress: subOrders[0].customerAddress,
        distance: `${totalDistanceVal.toFixed(1)} km`,
        rawDistance: totalDistanceVal,
        fee: `R$ ${totalFeeVal.toFixed(2).replace('.', ',')}`,
        rawFee: totalFeeVal,
        estimatedTime: `${estimatedMinutes} min`,
        paymentMethod: needsMachine ? 'Crédito (Levar Maquininha)' : 'Pago no App',
        paymentType: needsMachine ? 'machine_credit' : 'app',
        needsMachine,
        machineBonus,
        isAppPayment: !needsMachine,
        // Coordinates for Map
        storeLat: selectedRestaurant.lat || -23.563,
        storeLng: selectedRestaurant.lng || -46.654,
        customerLat: shuffledCustomers[0].lat,
        customerLng: shuffledCustomers[0].lng
    };
  };

  // Initial order generation
  useEffect(() => {
    if (!mockOrder) {
        setMockOrder(generateRandomOrder());
    }
  }, []);

  // --- SIMULATED DRIVER MOVEMENT ---
  useEffect(() => {
    // Move driver slowly towards destination based on step
    if (orderStep === 'idle' || orderStep === 'offering' || orderStep === 'completed') return;

    const interval = setInterval(() => {
       setDriverLocation(prev => {
          // Simple random movement jitter to simulate GPS update
          return {
             lat: prev.lat + (Math.random() - 0.5) * 0.0001,
             lng: prev.lng + (Math.random() - 0.5) * 0.0001
          };
       });
    }, 3000); // Reduced frequency for performance

    return () => clearInterval(interval);
  }, [orderStep]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, showChat]);

  // Offer Timer
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (orderStep === 'offering' && !isAccepting) {
      setOfferTimer(15);
      interval = setInterval(() => {
        setOfferTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [orderStep, isAccepting]);

  // Auto-reject if timer ends
  useEffect(() => {
    if (orderStep === 'offering' && offerTimer <= 0 && !isAccepting) {
      rejectOrder();
    }
  }, [offerTimer, orderStep, isAccepting]);

  // --- AUTOMATIC ORDER LOOP LOGIC ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    let loopTimeout: ReturnType<typeof setTimeout> | null = null;

    if (isOnline && orderStep === 'idle') {
      
      // 1. Poll for Store Panel orders immediately
      interval = setInterval(() => {
         const incomingOrder = localStorage.getItem('neo_incoming_order');
         if (incomingOrder) {
            const parsedOrder = JSON.parse(incomingOrder);
            setMockOrder(parsedOrder);
            localStorage.removeItem('neo_incoming_order');
            triggerIncomingOrder();
         }
      }, 1000);

      // 2. If no store order, generate random one after 4s to keep the "Game Loop" alive
      if (!mockOrder) {
         loopTimeout = setTimeout(() => {
            setMockOrder(generateRandomOrder());
            triggerIncomingOrder();
         }, 4000);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
      if (loopTimeout) clearTimeout(loopTimeout);
    };
  }, [isOnline, orderStep, mockOrder]);

  const playAnnouncer = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
       // Padrão de vibração profissional (3 pulsos distintos)
       navigator.vibrate([500, 200, 500, 200, 500]); 
    }
    
    // Voz da Marca (Apenas "Neo.")
    window.speechSynthesis.cancel();
    const simpleText = "Neo.";
    const simpleUtterance = new SpeechSynthesisUtterance(simpleText);
    simpleUtterance.lang = 'pt-BR';
    simpleUtterance.rate = 1.2;
    simpleUtterance.pitch = 1.0;
    window.speechSynthesis.speak(simpleUtterance);
    
    playProfessionalBeep();
  };

  const playProfessionalBeep = () => {
    if (!audioContextRef.current) {
      const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) audioContextRef.current = new AudioCtx();
    }
    const ctx = audioContextRef.current;
    if (!ctx) return;

    if (ctx.state === 'suspended') {
        ctx.resume();
    }

    try {
       const now = ctx.currentTime;
       
       // "Ti-ling" Effect (2 Crystal Tones)
       const osc1 = ctx.createOscillator();
       const gain1 = ctx.createGain();
       osc1.type = 'sine'; 
       osc1.frequency.setValueAtTime(987, now);
       gain1.gain.setValueAtTime(0.15, now);
       gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
       osc1.connect(gain1);
       gain1.connect(ctx.destination);
       osc1.start(now);
       osc1.stop(now + 0.2);

       const osc2 = ctx.createOscillator();
       const gain2 = ctx.createGain();
       osc2.type = 'sine'; 
       osc2.frequency.setValueAtTime(1318, now + 0.15);
       gain2.gain.setValueAtTime(0.15, now + 0.15);
       gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
       osc2.connect(gain2);
       gain2.connect(ctx.destination);
       osc2.start(now + 0.15);
       osc2.stop(now + 0.6);

    } catch(e) { console.error(e); }
  };

  const triggerIncomingOrder = () => {
    setOrderStep((currentStep) => {
       if (currentStep !== 'idle') return currentStep; 
       
       if (!audioContextRef.current) {
          const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (AudioCtx) audioContextRef.current = new AudioCtx();
       }

       playAnnouncer();
       if (ringIntervalRef.current) clearInterval(ringIntervalRef.current);
       ringIntervalRef.current = setInterval(playAnnouncer, 3500); 
       return 'offering';
    });
  };

  const stopAudio = () => {
    if (ringIntervalRef.current) {
       clearInterval(ringIntervalRef.current);
       ringIntervalRef.current = null;
    }
    if (navigator.vibrate) navigator.vibrate(0);
    window.speechSynthesis.cancel();
  };

  const openGoogleMaps = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${query}&travelmode=driving`, '_blank');
  };

  const openWaze = (address: string) => {
    const query = encodeURIComponent(address);
    window.open(`https://waze.com/ul?q=${query}&navigate=yes`, '_blank');
  };

  const openFullRoute = () => {
    if (!mockOrder) return;
    const dest = encodeURIComponent(mockOrder.customerAddress);
    const waypoint = encodeURIComponent(mockOrder.restaurantAddress);
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${dest}&waypoints=${waypoint}&travelmode=driving`, '_blank');
  };

  const acceptOrder = () => {
    stopAudio();
    setIsAccepting(true);
    // Animação rápida para feedback instantâneo
    setTimeout(() => {
      setIsAccepting(false);
      setArrivalTimer(11 * 60);
      setOrderStep('going_to_store');
      // Auto-navigate to store on accept
      if (mockOrder && mockOrder.restaurantAddress) {
         openGoogleMaps(mockOrder.restaurantAddress);
      }
    }, 1500); 
  };

  const handleArrivedAtStore = () => {
    setOrderStep('at_store');
  };

  const handleCollected = () => {
    setOrderStep('delivering');
  };

  const handleArrivedAtCustomer = () => {
    setOrderStep('at_customer');
  };

  const completeDelivery = () => {
    if (mockOrder?.needsMachine) {
      setOrderStep('returning_machine');
    } else {
      finishOrder();
    }
  };

  const confirmMachineReturn = () => finishOrder(true);

  const finishOrder = (isReturn = false) => {
    if (!mockOrder) return;
    setWaitingForCustomer(false);
    setOrderStep('completed');
    stopAudio();
    
    const finalAmount = mockOrder.rawFee + (isReturn ? 2.00 : 0);
    setDailyEarnings(prev => prev + finalAmount);
    setDailyAccepted(prev => prev + 1);
    
    const newTransaction = {
        id: Date.now().toString(),
        restaurant: mockOrder.restaurant,
        amount: finalAmount,
        date: new Date().toISOString(),
        type: 'delivery',
        status: 'completed',
        distance: mockOrder.distance,
        isAppPayment: mockOrder.isAppPayment
    };

    const existingTransactions = JSON.parse(localStorage.getItem('neo_transactions') || '[]');
    localStorage.setItem('neo_transactions', JSON.stringify([newTransaction, ...existingTransactions]));

    setTimeout(() => {
       setMockOrder(null); // Clear order to trigger regeneration in loop
       setOrderStep('idle');
    }, 4000);
  };

  const rejectOrder = () => {
    stopAudio();
    setDailyRejected(prev => prev + 1);
    setMockOrder(null); // Clear order to trigger regeneration
    setOrderStep('idle');
  };

  const toggleOnline = () => {
    if (!audioContextRef.current) {
       const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
       if (AudioCtx) audioContextRef.current = new AudioCtx();
    }
    if (audioContextRef.current?.state === 'suspended') {
        audioContextRef.current.resume();
    }

    setIsOnline(!isOnline);
    if (!isOnline) {
       setOrderStep('idle');
       // Will trigger auto-order in useEffect
    } else {
       setOrderStep('idle');
       stopAudio();
    }
  };
  
  const handleSendChatMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const msg: ChatMessage = { id: Date.now().toString(), sender: 'me', text: newMessage, timestamp: new Date() };
    setChatMessages(prev => [...prev, msg]);
    setNewMessage('');
    setTimeout(() => {
      const replies = ["Ok, aguardo.", "Estou vendo você no mapa."];
      const randomReply = replies[Math.floor(Math.random() * replies.length)];
      const replyMsg: ChatMessage = { id: (Date.now() + 1).toString(), sender: 'other', text: randomReply, timestamp: new Date() };
      setChatMessages(prev => [...prev, replyMsg]);
    }, 2500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mockOrder && isOnline && orderStep !== 'idle') return null; 

  const earningsPerKm = mockOrder ? (mockOrder.rawFee / mockOrder.rawDistance) : 0;
  const earningsPerKmFormatted = earningsPerKm.toFixed(2).replace('.', ',');
  const isHighPay = earningsPerKm > 2.0;

  // Prepare Locations for Map
  const pickupLoc = mockOrder ? { lat: mockOrder.storeLat, lng: mockOrder.storeLng } : null;
  const destLoc = mockOrder ? { lat: mockOrder.customerLat, lng: mockOrder.customerLng } : null;

  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden flex flex-col font-sans">
      
      {/* REAL GOOGLE MAP LAYER */}
      <GoogleMapIntegration 
         driverLocation={driverLocation}
         pickupLocation={pickupLoc}
         destination={destLoc}
         status={orderStep}
      />

      {/* TOP GRADIENT (Header Background) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-30"></div>

      {/* --- OFFERING OVERLAY --- */}
      {orderStep === 'offering' && !isAccepting && mockOrder && (
         <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col animate-fade-in font-sans">
            {/* Timer Bar */}
            <div className="w-full h-1.5 bg-gray-800">
               <div className="h-full bg-green-500 shadow-[0_0_10px_#22c55e] transition-all duration-1000 ease-linear" style={{ width: `${(offerTimer / 15) * 100}%` }}></div>
            </div>

            {/* Header Title */}
            <div className="absolute top-8 left-0 right-0 text-center z-20 pointer-events-none">
               <h2 className="text-4xl font-black text-white tracking-tighter italic drop-shadow-lg animate-pulse">
                  NEO<span className="text-[#EA1D2C]">.</span>
               </h2>
               <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-1">Nova Oferta</p>
            </div>
            
            {/* Route Preview */}
            <div className="flex-1 relative w-full overflow-hidden">
               {/* Abstract Map Background for Offer */}
               <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#374151 1px, transparent 1px), linear-gradient(90deg, #374151 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               
               <div className="absolute inset-0 flex items-center justify-center scale-125">
                  <svg className="w-full h-full" viewBox="0 0 400 400">
                     <defs>
                        <filter id="glow">
                           <feGaussianBlur stdDeviation="2.5" result="coloredBlur"/>
                           <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                     </defs>
                     <path d="M 120 280 Q 200 100 280 120" fill="none" stroke="#22c55e" strokeWidth="4" strokeLinecap="round" strokeDasharray="10 10" className="animate-dash" filter="url(#glow)" />
                     <circle cx="120" cy="280" r="8" fill="#3B82F6" className="animate-ping" />
                     <circle cx="120" cy="280" r="5" fill="white" />
                     <circle cx="280" cy="120" r="8" fill="#EA1D2C" className="animate-pulse" />
                     <circle cx="280" cy="120" r="5" fill="white" />
                  </svg>
               </div>

               <div className="absolute bottom-[30%] left-[10%] bg-gray-900/90 backdrop-blur border border-gray-700 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                  <span className="text-xs font-bold text-white">{mockOrder.restaurant.substring(0, 15)}</span>
               </div>
               <div className="absolute top-[25%] right-[10%] bg-gray-900/90 backdrop-blur border border-gray-700 px-3 py-1.5 rounded-xl shadow-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <span className="text-xs font-bold text-white">Cliente</span>
               </div>
            </div>
            
            {/* Offer Details Card */}
            <div className="bg-gray-900 border-t border-gray-800 rounded-t-3xl p-6 pb-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] relative z-30">
               <div className="w-12 h-1 bg-gray-700 rounded-full mx-auto mb-6"></div>

               <div className="flex justify-between items-start mb-6">
                  <div>
                     <div className="flex items-center gap-2 mb-2">
                        {mockOrder.isGrouped && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold uppercase shadow-lg shadow-purple-900/50">Rota {mockOrder.orderCount > 2 ? 'Tripla' : 'Dupla'}</span>}
                        {isHighPay && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1 shadow-lg shadow-green-900/50"><Gem size={10}/> Super Oferta</span>}
                     </div>
                     <h2 className="text-6xl font-black text-white tracking-tighter flex items-center gap-3">
                        {mockOrder.fee}
                     </h2>
                     <div className="flex items-center gap-2 mt-2">
                        {mockOrder.machineBonus > 0 && <span className="text-[10px] bg-green-900/50 text-green-400 px-2 py-1 rounded border border-green-800 font-bold uppercase">+ R$ 2,00 Maquininha</span>}
                        <span className="text-sm text-gray-400 font-medium">{mockOrder.paymentMethod}</span>
                     </div>
                  </div>
                  
                  <div className="text-right">
                     <div className="flex flex-col items-end">
                        <span className="text-3xl font-bold text-white">{mockOrder.distance}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Distância Total</span>
                     </div>
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-3 mb-6">
                  <div className="bg-gray-800 p-3 rounded-2xl text-center border border-gray-700 flex flex-col justify-center">
                     <Clock size={18} className="text-gray-500 mx-auto mb-1" />
                     <p className="text-lg font-bold text-white">{mockOrder.estimatedTime}</p>
                  </div>
                  
                  {/* Highlighted Earnings per KM */}
                  <div className="bg-green-900 p-3 rounded-2xl text-center border-2 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.4)] transform scale-110 z-10 flex flex-col justify-center relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-t from-green-900 to-green-800 opacity-50"></div>
                     <div className="relative z-10">
                        <p className="text-[10px] text-green-300 uppercase font-black tracking-wide mb-0.5">R$ / KM</p>
                        <p className="text-xl font-black text-white drop-shadow-sm">R$ {earningsPerKmFormatted}</p>
                     </div>
                  </div>

                  <div className="bg-gray-800 p-3 rounded-2xl text-center border border-gray-700 flex flex-col justify-center">
                     <MapPin size={18} className="text-gray-500 mx-auto mb-1" />
                     <p className="text-xs font-bold text-white truncate max-w-full">{mockOrder.customerAddress.split(',')[0]}</p>
                  </div>
               </div>

               <div className="flex gap-4 h-14">
                  <button onClick={rejectOrder} className="h-full aspect-square rounded-2xl font-bold text-white bg-gray-800 border border-gray-700 hover:bg-gray-700 active:scale-95 transition-all flex items-center justify-center">
                     <X size={28} className="text-red-500" />
                  </button>
                  <button onClick={acceptOrder} className="flex-1 h-full rounded-2xl font-black text-xl text-white bg-[#EA1D2C] hover:bg-red-600 active:scale-95 shadow-[0_0_30px_rgba(234,29,44,0.4)] transition-all flex items-center justify-center gap-2">
                     ACEITAR CORRIDA
                  </button>
               </div>
            </div>
         </div>
      )}

      {/* FEEDBACK AO ACEITAR */}
      {isAccepting && (
         <div className="absolute inset-0 z-[110] bg-green-600 flex flex-col items-center justify-center text-white animate-fade-in">
            <div className="bg-white rounded-full p-8 shadow-2xl mb-6 animate-bounce">
               <CheckCircle size={80} className="text-green-600" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black tracking-tighter mb-2">Corrida Aceita!</h2>
            <p className="text-lg font-medium opacity-90">Iniciando navegação...</p>
         </div>
      )}

      {/* TELA DE SUCESSO */}
      {orderStep === 'completed' && mockOrder && (
         <div className="absolute inset-0 z-[60] bg-green-500 flex flex-col items-center justify-center text-white animate-fade-in">
            <div className="bg-white rounded-full p-6 shadow-2xl mb-6 animate-bounce-in">
               <CheckCircle size={64} className="text-green-600" strokeWidth={3} />
            </div>
            <h2 className="text-4xl font-black mb-2 tracking-tight">Finalizado!</h2>
            <p className="text-lg opacity-90 mb-10 font-medium">Entrega realizada com sucesso.</p>
            <div className="bg-white/20 backdrop-blur-md border border-white/30 rounded-3xl p-8 min-w-[280px] text-center shadow-xl">
               <p className="text-sm font-bold uppercase tracking-wider mb-2 opacity-80">Você ganhou</p>
               <div className="text-5xl font-black tracking-tighter">
                  {mockOrder.fee}
               </div>
               {mockOrder.needsMachine && <div className="mt-2 text-xs font-bold bg-white/20 px-2 py-1 rounded-full inline-block">Inclui Bônus Maquininha</div>}
            </div>
         </div>
      )}

      {/* HEADER FLUTUANTE (Perfil) */}
      <div className="absolute top-0 left-0 right-0 z-40 p-4 pt-6 pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <div className="flex gap-3">
             <button onClick={onOpenSidebar} className="w-10 h-10 rounded-full shadow-lg transition-transform active:scale-95 overflow-hidden border-2 border-white flex items-center justify-center bg-gray-200">
               {userPhoto ? <img src={userPhoto} alt="Perfil" className="w-full h-full object-cover" /> : <User size={20} className="text-gray-500" />}
             </button>
          </div>
        </div>
      </div>

      {/* CHART POPOVER */}
      {showChart && orderStep === 'idle' && (
         <div className="absolute bottom-28 left-4 right-4 z-50 animate-fade-in">
            <div className="bg-gray-900/95 backdrop-blur-xl p-4 rounded-2xl shadow-2xl border border-white/10">
               <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2"><TrendingUp size={14} className="text-green-500"/> Histórico Semanal</h3>
                  <button onClick={() => setShowChart(false)} className="text-gray-400 hover:text-white"><XCircle size={18} /></button>
               </div>
               <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                     <AreaChart data={WEEKLY_DATA}>
                        <defs>
                           <linearGradient id="colorEarnings" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                           </linearGradient>
                        </defs>
                        <XAxis dataKey="name" tick={{fill: '#9ca3af', fontSize: 10}} axisLine={false} tickLine={false}/>
                        <Tooltip contentStyle={{backgroundColor: '#1f2937', border: 'none', borderRadius: '8px', fontSize: '12px', color: '#fff'}} itemStyle={{color: '#22c55e'}} formatter={(value: number) => [`R$ ${value}`, 'Ganhos']}/>
                        <Area type="monotone" dataKey="value" stroke="#22c55e" strokeWidth={2} fillOpacity={1} fill="url(#colorEarnings)" />
                     </AreaChart>
                  </ResponsiveContainer>
               </div>
            </div>
         </div>
      )}

      {/* STATS WIDGET */}
      {orderStep === 'idle' && (
         <div className="absolute bottom-6 left-4 z-40 flex items-center gap-2 pointer-events-auto">
            <div className="bg-gray-900/90 backdrop-blur-md p-2 pr-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-3 pointer-events-auto hover:scale-105 transition-transform active:scale-95">
                <div onClick={() => onNavigate?.(View.WALLET)} className="flex items-center gap-3 cursor-pointer">
                   <div className="bg-green-500/20 p-1.5 rounded-lg"><DollarSign size={16} className="text-green-500" /></div>
                   <div>
                       <p className="text-[8px] text-gray-400 font-bold uppercase tracking-wider">Saldo</p>
                       <p className="text-sm font-black text-white leading-none">R$ {dailyEarnings.toFixed(2).replace('.', ',')}</p>
                   </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); setShowChart(!showChart); }} className={`p-1.5 rounded-full transition-colors ${showChart ? 'bg-white/20 text-white' : 'hover:bg-white/10 text-gray-400'}`}><BarChart2 size={14} /></button>
            </div>
            <div className="bg-gray-900/90 backdrop-blur-md p-2 pr-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-2 pointer-events-auto">
                <CheckCircle size={14} className="text-blue-500" />
                <div><p className="text-[8px] text-gray-400 font-bold uppercase">Aceitas</p><p className="text-xs font-black text-white">{dailyAccepted}</p></div>
            </div>
            <div className="bg-gray-900/90 backdrop-blur-md p-2 pr-3 rounded-xl shadow-xl border border-gray-700 flex items-center gap-2 pointer-events-auto">
                <XCircle size={14} className="text-red-500" />
                <div><p className="text-[8px] text-gray-400 font-bold uppercase">Recusadas</p><p className="text-xs font-black text-white">{dailyRejected}</p></div>
            </div>
         </div>
      )}

      {/* SOS BUTTON */}
      {isOnline && (
        <div className="absolute bottom-6 right-4 z-40">
           <div className="relative group">
              <button className="w-12 h-12 rounded-full bg-blue-600/90 text-white shadow-lg flex items-center justify-center backdrop-blur-md border border-white/20 animate-pulse hover:bg-blue-700 transition-all active:scale-95">
                 <ShieldAlert size={24} />
              </button>
              <div className="absolute bottom-16 right-0 w-48 bg-white rounded-xl shadow-xl p-2 hidden group-hover:block group-focus-within:block animate-fade-in border border-gray-200">
                 <a href="tel:190" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-800">
                    <div className="bg-red-100 text-red-600 p-1.5 rounded"><Phone size={16} /></div>
                    <span className="text-sm font-bold">Polícia (190)</span>
                 </a>
                 <a href="tel:193" className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg text-gray-800">
                    <div className="bg-red-100 text-red-600 p-1.5 rounded"><Zap size={16} /></div>
                    <span className="text-sm font-bold">Bombeiros (193)</span>
                 </a>
              </div>
           </div>
        </div>
      )}

      {/* STATUS BUTTON (TOP) */}
      {orderStep === 'idle' && (
         <div className="absolute top-6 left-1/2 transform -translate-x-1/2 z-50 flex flex-col items-center">
            <button onClick={toggleOnline} className={`flex items-center gap-2 px-5 py-2 rounded-full shadow-xl transition-all duration-300 ease-out border ${isOnline ? 'bg-white border-green-500 text-green-700 shadow-green-500/20' : 'bg-gray-900 border-gray-800 text-gray-300'}`}>
               <div className={`transition-transform duration-500 ${isOnline ? 'rotate-180' : ''}`}>
                  <Power size={14} strokeWidth={3} className={isOnline ? 'text-green-600' : 'text-gray-400'} />
               </div>
               <span className="text-xs font-black uppercase tracking-wide">{isOnline ? 'Disponível' : 'Indisponível'}</span>
            </button>
            {isOnline && (
               <span className="mt-2 text-[10px] font-bold text-white bg-green-600 shadow-lg shadow-green-500/30 backdrop-blur px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                  <Compass size={10} className="animate-spin" /> Procurando rotas...
               </span>
            )}
         </div>
      )}

      {/* PAINEL DE ROTA ATIVA */}
      {(orderStep === 'going_to_store' || orderStep === 'at_store' || orderStep === 'delivering' || orderStep === 'at_customer' || orderStep === 'returning_machine') && mockOrder && (
         <div className="absolute bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl border-t border-gray-200 animate-slide-up">
            <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-1"></div>

            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
               <div>
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                     {orderStep === 'going_to_store' || orderStep === 'returning_machine' ? 'Indo para Coleta' : orderStep === 'at_store' ? 'Na Loja' : 'Indo para Entrega'}
                     <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{mockOrder.estimatedTime}</span>
                  </h2>
                  <p className="text-sm text-gray-500 truncate max-w-[200px]">
                     {orderStep === 'going_to_store' || orderStep === 'at_store' || orderStep === 'returning_machine' ? mockOrder.restaurant : mockOrder.customerName}
                  </p>
               </div>
               <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Valor</p>
                  <p className="text-xl font-black text-green-600">{mockOrder.fee}</p>
                  {mockOrder.needsMachine && <span className="text-[10px] font-bold text-green-600">+ R$ 2,00</span>}
               </div>
            </div>

            <div className="p-6 space-y-4 bg-gray-50 max-h-[60vh] overflow-y-auto">
               {/* Etapa 1: Coleta */}
               <div className={`relative pl-8 pb-6 border-l-2 ${['going_to_store', 'at_store'].includes(orderStep) ? 'border-blue-500' : 'border-gray-300'}`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${['going_to_store', 'at_store'].includes(orderStep) ? 'bg-blue-500 border-white shadow' : 'bg-gray-300 border-gray-100'}`}></div>
                  <div className={`p-4 bg-white rounded-xl border shadow-sm ${['going_to_store', 'at_store'].includes(orderStep) ? 'border-blue-200 ring-1 ring-blue-50' : 'border-gray-200 opacity-70'}`}>
                     <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Retirada</span>
                        {mockOrder.isGrouped && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 rounded-full font-bold">Múltiplos Pedidos</span>}
                     </div>
                     <h3 className="font-bold text-gray-900">{mockOrder.restaurant}</h3>
                     <p className="text-sm text-gray-500 mb-3">{mockOrder.restaurantAddress}</p>
                     
                     <div className="flex gap-2 mb-3">
                       <button onClick={() => openGoogleMaps(mockOrder.restaurantAddress)} className="flex-1 bg-blue-50 text-blue-700 py-2 rounded-lg text-xs font-bold hover:bg-blue-100 transition-colors flex items-center justify-center gap-1">
                          <Navigation size={14} /> Abrir no Maps
                       </button>
                       {orderStep === 'going_to_store' && (
                          <button onClick={openFullRoute} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg text-xs font-bold hover:bg-gray-200 transition-colors">
                             Ver Rota Completa
                          </button>
                       )}
                     </div>

                     {orderStep === 'at_store' && (
                        <div className="mt-2 bg-yellow-50 border border-yellow-200 p-3 rounded-lg flex items-center justify-between animate-pulse">
                           <div>
                              <p className="text-[10px] font-bold text-yellow-800 uppercase">Código de Coleta</p>
                              <p className="text-xs text-yellow-700">Informe ao restaurante</p>
                           </div>
                           <span className="text-2xl font-mono font-black text-gray-900 tracking-widest">{mockOrder.pickupCode}</span>
                        </div>
                     )}
                  </div>
               </div>

               {/* Etapa 2: Entrega */}
               <div className={`relative pl-8 border-l-2 border-transparent`}>
                  <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 ${['delivering', 'at_customer'].includes(orderStep) ? 'bg-[#EA1D2C] border-white shadow' : 'bg-gray-300 border-gray-100'}`}></div>
                  <div className={`p-4 bg-white rounded-xl border shadow-sm ${['delivering', 'at_customer'].includes(orderStep) ? 'border-red-200 ring-1 ring-red-50' : 'border-gray-200 opacity-70'}`}>
                     <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-[#EA1D2C] uppercase tracking-wider">Entrega</span>
                        <span className="text-[10px] font-bold bg-gray-100 px-2 py-0.5 rounded text-gray-600">ID #{mockOrder.id}</span>
                     </div>
                     <h3 className="font-bold text-gray-900">{mockOrder.customerName}</h3>
                     <p className="text-sm text-gray-500 mb-3">{mockOrder.customerAddress}</p>
                     
                     <div className="bg-gray-50 p-2 rounded border border-gray-100 mb-3">
                        <p className="text-xs text-gray-600 flex items-center gap-2">
                           <Package size={14} /> Confira o ID na etiqueta do pacote.
                        </p>
                     </div>

                     <div className="flex gap-2 mb-3">
                       <button onClick={() => openGoogleMaps(mockOrder.customerAddress)} className="flex-1 bg-red-50 text-red-700 py-2 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                          <Navigation size={14} /> Abrir no Maps
                       </button>
                     </div>

                     <div className="bg-gray-100 p-3 rounded-lg flex items-center gap-3">
                        {mockOrder.paymentType === 'app' ? <Smartphone className="text-green-600" size={20} /> : mockOrder.paymentType === 'money' ? <DollarSign className="text-green-600" size={20} /> : <CreditCard className="text-blue-600" size={20}/>}
                        <div>
                           <p className="text-xs font-bold text-gray-500 uppercase">Cobrar Cliente</p>
                           <p className="text-sm font-bold text-gray-900">{mockOrder.paymentMethod}</p>
                        </div>
                     </div>
                  </div>
               </div>

               <div className="pt-2 pb-4">
                  {orderStep === 'going_to_store' && (
                     <button onClick={handleArrivedAtStore} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                        Cheguei na Loja
                     </button>
                  )}
                  {orderStep === 'at_store' && (
                     <button onClick={handleCollected} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all flex items-center justify-center gap-2">
                        <Package size={20} /> Saí para Entrega
                     </button>
                  )}
                  {orderStep === 'delivering' && (
                     <button onClick={handleArrivedAtCustomer} className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold shadow-lg hover:bg-blue-700 transition-all">
                        Cheguei no Cliente
                     </button>
                  )}
                  {orderStep === 'at_customer' && (
                     <div className="space-y-3">
                        <button onClick={completeDelivery} className="w-full py-4 bg-[#EA1D2C] text-white rounded-xl font-bold shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2">
                           <CheckCircle size={24} /> FINALIZAR ENTREGA
                        </button>
                        <button onClick={() => setShowHelpModal(true)} className="w-full py-3 bg-gray-200 text-gray-600 rounded-xl font-bold hover:bg-gray-300 transition-all flex items-center justify-center gap-2 text-sm">
                           <AlertTriangle size={16} /> Problemas na entrega?
                        </button>
                     </div>
                  )}
                  {orderStep === 'returning_machine' && (
                     <div className="space-y-3">
                        <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-xl text-center">
                           <p className="text-sm font-bold text-yellow-800">Retorne ao Restaurante</p>
                           <p className="text-xs text-yellow-700">Devolva a maquininha para receber o bônus.</p>
                        </div>
                        <button onClick={confirmMachineReturn} className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-gray-800 transition-all">
                           Confirmar Devolução (+ R$ 2,00)
                        </button>
                     </div>
                  )}
               </div>
            </div>
         </div>
      )}

      {showChat && (
         <div className="absolute inset-0 z-[100] bg-white flex flex-col animate-fade-in">
            <div className="bg-green-600 p-4 flex items-center gap-3 text-white shadow-md">
               <button onClick={() => setShowChat(false)} className="p-1 hover:bg-green-700 rounded-full"><X size={24} /></button>
               <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-white overflow-hidden border border-white">
                      <img src="https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=100&h=100&fit=crop" alt="Loja" className="w-full h-full object-cover" />
                  </div>
                  <div>
                     <h3 className="font-bold text-sm leading-tight">{mockOrder?.restaurant || "Loja"}</h3>
                     <p className="text-[10px] text-green-100">Online agora</p>
                  </div>
               </div>
            </div>
            <div className="flex-1 bg-[#efeae2] p-4 overflow-y-auto space-y-3">
               {chatMessages.length === 0 && (
                  <div className="text-center text-xs text-gray-400 my-4 bg-white/50 p-2 rounded-full mx-auto w-fit">
                     Inicie a conversa
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
            <form onSubmit={handleSendChatMessage} className="p-3 bg-white border-t border-gray-200 flex items-center gap-2">
               <input autoFocus type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Digite sua mensagem..." className="flex-1 p-3 bg-gray-100 rounded-full outline-none focus:ring-1 focus:ring-green-500 transition-all" />
               <button type="submit" disabled={!newMessage.trim()} className="p-3 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"><Send size={20} /></button>
            </form>
         </div>
      )}
    </div>
  );
};

export default Dashboard;
