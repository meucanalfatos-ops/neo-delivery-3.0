
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Power, MapPin, Navigation, Store, Bell, Bike, Volume2, Phone, MessageCircle, CreditCard, CheckCircle, Plus, Minus, Crosshair, Gem, Trophy, Award, Menu, RotateCcw, TrendingUp, Clock, Send, X, Map, AlertTriangle, HelpCircle, Timer, DollarSign, Package, Compass, Zap, ThumbsUp, User, ShieldAlert, CloudSun, Lock, XCircle, BarChart2, ShieldCheck, Smartphone } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { generateSpeech } from '../services/geminiService';
import { MOCK_STATS, MOCK_STORES, WEEKLY_DATA } from '../constants';
import { DriverLevel, ChatMessage, View } from '../types';

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
  const [waitTimer, setWaitTimer] = useState(600);
  const [isAccepting, setIsAccepting] = useState(false);
  const [showChart, setShowChart] = useState(false);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const ringIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [mapZoom, setMapZoom] = useState(1);
  const [mapOffset, setMapOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [is3DMode, setIs3DMode] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const initialOffset = useRef({ x: 0, y: 0 });
  const [selectedPin, setSelectedPin] = useState<'store' | 'customer' | string | null>(null);

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

  // Posições Fixas no Mapa Virtual (Pixels relativos ao centro 0,0)
  const POS_DRIVER_START = { x: 0, y: 0 };
  const POS_STORE = { x: -250, y: -250 };
  const POS_CUSTOMER = { x: 250, y: 250 };

  // Simulação de Geolocalização do Entregador (Centro: Av. Paulista/Masp)
  const driverLocation = { lat: -23.561684, lng: -46.655981 };
  const MAP_SCALE = 25000; 

  // Generate random "3D Buildings" for map immersion
  const cityBuildings = useMemo(() => {
    return Array.from({ length: 40 }).map((_, i) => ({
        id: i,
        left: (Math.random() * 3000) - 1500,
        top: (Math.random() * 3000) - 1500,
        width: 40 + Math.random() * 80,
        height: 40 + Math.random() * 80,
        depth: 50 + Math.random() * 150, 
        color: Math.random() > 0.8 ? '#e5e7eb' : '#f3f4f6' // Light gray building style
    }));
  }, []);

  const getPixelPosition = (targetLat: number, targetLng: number) => {
     const x = (targetLng - driverLocation.lng) * MAP_SCALE;
     const y = -(targetLat - driverLocation.lat) * MAP_SCALE; 
     return { x, y };
  };

  const generateRandomOrder = () => {
    const rand = Math.random();
    let orderCount = 1;
    if (rand > 0.7) orderCount = 2;
    if (rand > 0.9) orderCount = 3;

    const isGrouped = orderCount > 1;
    
    const randomStoreIndex = Math.floor(Math.random() * MOCK_STORES.length);
    const selectedRestaurant = MOCK_STORES[randomStoreIndex];
    
    const possibleCustomers = [
        { name: 'Juliana Martins', address: 'Rua Augusta, 1500' },
        { name: 'Roberto Carlos', address: 'Al. Santos, 800' },
        { name: 'Ana Pereira', address: 'Rua Frei Caneca, 300' },
        { name: 'Marcos Souza', address: 'Rua da Consolação, 900' }
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
        isAppPayment: !needsMachine 
    };
  };

  // Initial order generation
  useEffect(() => {
    if (!mockOrder) {
        setMockOrder(generateRandomOrder());
    }
  }, []);

  // --- CAMERA AND DRIVER POSITION LOGIC ---
  useEffect(() => {
    if (isDragging) return; 

    let targetX = 0;
    let targetY = 0;
    let targetZoom = 1;

    // Lógica de Câmera: Seguir o Motorista
    switch (orderStep) {
        case 'idle':
            targetX = 0; targetY = 0; targetZoom = 1;
            break;
        case 'going_to_store':
            // Câmera tenta ficar entre o motorista e a loja
            targetX = 125; targetY = 125; targetZoom = 0.8; 
            break;
        case 'at_store':
            // Foca na loja
            targetX = 250; targetY = 250; targetZoom = 1.6;
            break;
        case 'delivering':
            // Motorista indo para cliente
            targetX = 0; targetY = 0; targetZoom = 0.7;
            break;
        case 'at_customer':
            // Foca no cliente
            targetX = -250; targetY = -250; targetZoom = 1.6;
            break;
        case 'returning_machine':
            targetX = 0; targetY = 0; targetZoom = 0.8;
            break;
        default:
            targetX = 0; targetY = 0; targetZoom = 1;
    }

    setMapOffset({ x: targetX, y: targetY });
    setMapZoom(targetZoom);

  }, [orderStep, isDragging]);

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
       // Padrão de vibração mais intenso e longo (estilo chamada)
       navigator.vibrate([1000, 500, 1000, 500, 1000]); 
    }
    
    // Voz da Marca
    window.speechSynthesis.cancel();
    const simpleText = "Neo Delivery, Neo Delivery.";
    const simpleUtterance = new SpeechSynthesisUtterance(simpleText);
    simpleUtterance.lang = 'pt-BR';
    simpleUtterance.rate = 1.1;
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
       // Efeito de "Ti-Li-Ling" Profissional (Tríade C6 - E6 - G6)
       
       // Nota 1 (C6 ~ 1046Hz)
       const osc1 = ctx.createOscillator();
       const gain1 = ctx.createGain();
       osc1.type = 'sine'; 
       osc1.frequency.setValueAtTime(1046, now);
       gain1.gain.setValueAtTime(0.1, now);
       gain1.gain.exponentialRampToValueAtTime(0.5, now + 0.05);
       gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
       osc1.connect(gain1);
       gain1.connect(ctx.destination);
       osc1.start(now);
       osc1.stop(now + 0.25);

       // Nota 2 (E6 ~ 1318Hz)
       const osc2 = ctx.createOscillator();
       const gain2 = ctx.createGain();
       osc2.type = 'sine'; 
       osc2.frequency.setValueAtTime(1318, now + 0.15);
       gain2.gain.setValueAtTime(0.1, now + 0.15);
       gain2.gain.exponentialRampToValueAtTime(0.5, now + 0.2);
       gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
       osc2.connect(gain2);
       gain2.connect(ctx.destination);
       osc2.start(now + 0.15);
       osc2.stop(now + 0.45);

       // Nota 3 (G6 ~ 1568Hz) - Longa
       const osc3 = ctx.createOscillator();
       const gain3 = ctx.createGain();
       osc3.type = 'triangle'; // Triangle para cortar o som ambiente
       osc3.frequency.setValueAtTime(1568, now + 0.30);
       gain3.gain.setValueAtTime(0.1, now + 0.30);
       gain3.gain.exponentialRampToValueAtTime(0.6, now + 0.35);
       gain3.gain.exponentialRampToValueAtTime(0.001, now + 1.5);
       osc3.connect(gain3);
       gain3.connect(ctx.destination);
       osc3.start(now + 0.30);
       osc3.stop(now + 1.5);

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
      setIs3DMode(true);
      if (mockOrder) openGoogleMaps(mockOrder.restaurantAddress);
    }, 1500); // Reduzido para 1.5s para sensação mais ágil
  };

  const handleArrivedAtStore = () => {
    setOrderStep('at_store');
    setIs3DMode(false);
  };

  const handleCollected = () => {
    setOrderStep('delivering');
    setIs3DMode(true); 
  };

  const handleArrivedAtCustomer = () => {
    setOrderStep('at_customer');
    setIs3DMode(false);
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
       setIs3DMode(false);
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

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    dragStart.current = { x: clientX, y: clientY };
    initialOffset.current = { ...mapOffset };
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    const dx = clientX - dragStart.current.x;
    const dy = clientY - dragStart.current.y;
    setMapOffset({ x: initialOffset.current.x + dx, y: initialOffset.current.y + dy });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleWheel = (e: React.WheelEvent) => {
    const zoomSensitivity = 0.001;
    const newZoom = mapZoom + (e.deltaY * -zoomSensitivity);
    setMapZoom(Math.min(Math.max(0.5, newZoom), 3));
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

  return (
    <div className="relative h-screen bg-gray-100 overflow-hidden flex flex-col font-sans">
      
      {/* BACKGROUND MAP LAYER */}
      <div 
        className={`absolute inset-0 z-0 transition-all duration-1000 ${is3DMode ? 'perspective-[1000px]' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleMouseDown}
        onTouchMove={handleMouseMove}
        onTouchEnd={handleMouseUp}
        onWheel={handleWheel}
      >
         <div 
            className="absolute inset-0 transition-transform duration-1000 ease-in-out bg-[#e5e7eb]"
            style={{ 
               transform: `translate(${mapOffset.x}px, ${mapOffset.y}px) scale(${mapZoom}) ${is3DMode ? 'rotateX(45deg)' : 'rotateX(0deg)'}`,
               transformOrigin: 'center center',
               backgroundImage: 'linear-gradient(#d1d5db 2px, transparent 2px), linear-gradient(90deg, #d1d5db 2px, transparent 2px)',
               backgroundSize: '100px 100px'
            }}
         >
            {/* 3D Buildings */}
            {is3DMode && cityBuildings.map((b) => (
               <div 
                  key={b.id}
                  className="absolute transition-opacity duration-500"
                  style={{
                     left: `calc(50% + ${b.left}px)`,
                     top: `calc(50% + ${b.top}px)`,
                     width: `${b.width}px`,
                     height: `${b.height}px`,
                     backgroundColor: b.color,
                     boxShadow: '-10px 10px 20px rgba(0,0,0,0.2)',
                     transform: `translateZ(${b.depth}px)`, // Simula altura
                     opacity: mapZoom > 0.8 ? 1 : 0
                  }}
               ></div>
            ))}

            {/* Driver Pin (Always Center relative to map logic) */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center transition-all duration-[2000ms]">
                <div className="relative">
                   {/* Headlight beam in 3D mode */}
                   {is3DMode && <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-32 h-32 bg-yellow-400/20 blur-xl rounded-full clip-path-triangle"></div>}
                   <div className="w-4 h-4 bg-blue-500 rounded-full ring-4 ring-white shadow-xl z-20 relative"></div>
                   <div className="w-12 h-12 bg-blue-500/20 rounded-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
                </div>
            </div>

            {/* Store Pin */}
            <div 
               className="absolute flex flex-col items-center cursor-pointer group z-10"
               style={{ 
                  left: `calc(50% + ${POS_STORE.x}px)`, 
                  top: `calc(50% + ${POS_STORE.y}px)` 
               }}
               onClick={(e) => { e.stopPropagation(); setSelectedPin('store'); }}
            >
               <div className={`p-2 bg-white rounded-full shadow-lg transform transition-transform group-hover:scale-110 border-2 ${selectedPin === 'store' ? 'border-blue-600 scale-125' : 'border-gray-800'}`}>
                  <Store size={24} className="text-gray-800" />
               </div>
               {selectedPin === 'store' && (
                  <div className="absolute bottom-12 bg-white p-3 rounded-xl shadow-2xl min-w-[160px] animate-fade-in z-50">
                     <p className="font-bold text-sm text-gray-900">{mockOrder?.restaurant || "Restaurante"}</p>
                     <p className="text-xs text-gray-500 mb-2">{mockOrder?.restaurantAddress}</p>
                     <div className="flex gap-2">
                        <button onClick={() => openGoogleMaps(mockOrder?.restaurantAddress || "")} className="flex-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Map size={12}/> Maps</button>
                        <button onClick={() => openWaze(mockOrder?.restaurantAddress || "")} className="flex-1 bg-blue-50 text-blue-600 p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Navigation size={12}/> Waze</button>
                     </div>
                  </div>
               )}
            </div>

            {/* Customer Pin */}
            <div 
               className="absolute flex flex-col items-center cursor-pointer group z-10"
               style={{ 
                  left: `calc(50% + ${POS_CUSTOMER.x}px)`, 
                  top: `calc(50% + ${POS_CUSTOMER.y}px)` 
               }}
               onClick={(e) => { e.stopPropagation(); setSelectedPin('customer'); }}
            >
               <div className={`p-2 bg-[#EA1D2C] rounded-full shadow-lg transform transition-transform group-hover:scale-110 border-2 ${selectedPin === 'customer' ? 'border-white ring-2 ring-red-500 scale-125' : 'border-white'}`}>
                  <User size={24} className="text-white" />
               </div>
               {selectedPin === 'customer' && (
                  <div className="absolute bottom-12 bg-white p-3 rounded-xl shadow-2xl min-w-[160px] animate-fade-in z-50">
                     <p className="font-bold text-sm text-gray-900">{mockOrder?.customerName || "Cliente"}</p>
                     <p className="text-xs text-gray-500 mb-2">{mockOrder?.customerAddress}</p>
                     <div className="flex gap-2">
                        <button onClick={() => openGoogleMaps(mockOrder?.customerAddress || "")} className="flex-1 bg-red-50 text-red-600 p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Map size={12}/> Maps</button>
                        <button onClick={() => openWaze(mockOrder?.customerAddress || "")} className="flex-1 bg-red-50 text-red-600 p-1.5 rounded-lg text-[10px] font-bold flex items-center justify-center gap-1"><Navigation size={12}/> Waze</button>
                     </div>
                  </div>
               )}
            </div>

            {/* Route Lines */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
               <defs>
                  <marker id="arrow" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto-start-reverse">
                     <path d="M 0 0 L 10 5 L 0 10 z" fill="#3B82F6" />
                  </marker>
               </defs>
               
               {/* Path to Store */}
               {(orderStep === 'going_to_store') && (
                  <line 
                     x1={`calc(50% + ${POS_DRIVER_START.x}px)`} y1={`calc(50% + ${POS_DRIVER_START.y}px)`} 
                     x2={`calc(50% + ${POS_STORE.x}px)`} y2={`calc(50% + ${POS_STORE.y}px)`} 
                     stroke="#3B82F6" strokeWidth="4" strokeDasharray="10 10" markerEnd="url(#arrow)" 
                     className="animate-dash"
                  />
               )}

               {/* Path to Customer */}
               {(orderStep === 'delivering') && (
                  <line 
                     x1={`calc(50% + ${POS_STORE.x}px)`} y1={`calc(50% + ${POS_STORE.y}px)`} 
                     x2={`calc(50% + ${POS_CUSTOMER.x}px)`} y2={`calc(50% + ${POS_CUSTOMER.y}px)`} 
                     stroke="#EA1D2C" strokeWidth="4" strokeLinecap="round" 
                  />
               )}
            </svg>
         </div>
         
         {/* Gradient Overlay for Depth */}
         <div className="absolute inset-0 bg-gradient-to-b from-gray-100/50 via-transparent to-gray-100/50 pointer-events-none"></div>
      </div>

      {/* TOP GRADIENT (Header Background) */}
      <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-30"></div>

      {/* --- OFFERING OVERLAY --- */}
      {orderStep === 'offering' && !isAccepting && mockOrder && (
         <div className="fixed inset-0 z-[100] bg-gray-900/95 backdrop-blur-md flex flex-col animate-fade-in">
            <div className="w-full h-2 bg-gray-800">
               <div className="h-full bg-[#EA1D2C] transition-all duration-1000 ease-linear" style={{ width: `${(offerTimer / 15) * 100}%` }}></div>
            </div>
            <div className="absolute top-6 left-1/2 transform -translate-x-1/2 text-center animate-pulse">
               <h2 className="text-3xl font-black text-white tracking-tighter italic">NEO</h2>
            </div>
            
            {/* Card Info */}
            <div className="flex-1 flex flex-col justify-end p-6 pb-10">
               <div className="bg-gray-800 rounded-3xl p-6 border border-gray-700 shadow-2xl mb-4">
                  <div className="flex justify-between items-start mb-6">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                           {mockOrder.isGrouped && <span className="text-[10px] bg-purple-600 text-white px-2 py-0.5 rounded font-bold uppercase">Rota {mockOrder.orderCount > 2 ? 'Tripla' : 'Dupla'}</span>}
                           {isHighPay && <span className="text-[10px] bg-green-500 text-black px-2 py-0.5 rounded font-bold uppercase flex items-center gap-1"><Gem size={10}/> Super Oferta</span>}
                        </div>
                        <h2 className="text-5xl font-black text-white tracking-tighter flex items-center gap-3">
                           {mockOrder.fee}
                           {mockOrder.machineBonus > 0 && <span className="text-sm bg-green-900 text-green-400 px-2 py-1 rounded-lg font-bold border border-green-700">+ R$ 2,00</span>}
                        </h2>
                        <p className="text-gray-400 text-sm font-medium mt-1">{mockOrder.restaurant} • {mockOrder.paymentMethod}</p>
                     </div>
                     <div className="text-right">
                        <div className="text-3xl font-bold text-gray-300">{mockOrder.distance}</div>
                        <div className="text-xs text-gray-500 uppercase font-bold">Total Percorrido</div>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-8">
                     <div className="bg-gray-900 p-3 rounded-xl text-center border border-gray-700">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Tempo Est.</p>
                        <p className="text-lg font-bold text-white">{mockOrder.estimatedTime}</p>
                     </div>
                     <div className="bg-green-900 p-3 rounded-xl text-center border-2 border-green-400 shadow-[0_0_30px_rgba(74,222,128,0.6)] transform scale-105 z-10">
                        <p className="text-[10px] text-green-300 uppercase font-bold">Ganho / KM</p>
                        <p className="text-xl font-black text-white drop-shadow-md">R$ {earningsPerKmFormatted}</p>
                     </div>
                     <div className="bg-gray-900 p-3 rounded-xl text-center border border-gray-700">
                        <p className="text-[10px] text-gray-400 uppercase font-bold">Destino</p>
                        <p className="text-xs font-bold text-white truncate">{mockOrder.customerAddress.split(',')[0]}</p>
                     </div>
                  </div>

                  <div className="flex gap-4">
                     <button onClick={rejectOrder} className="flex-1 py-4 rounded-2xl font-bold text-white bg-gray-900 border border-gray-700 hover:bg-gray-700 transition-all flex items-center justify-center gap-2">
                        <X size={24} className="text-red-500" /> Recusar
                     </button>
                     <button onClick={acceptOrder} className="flex-[2] py-4 rounded-2xl font-black text-white bg-[#EA1D2C] hover:bg-red-600 shadow-lg shadow-red-900/50 transition-all flex items-center justify-center gap-2 text-xl transform active:scale-95">
                        Aceitar entrega
                     </button>
                  </div>
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
