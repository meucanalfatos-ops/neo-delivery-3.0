
import React, { useState, useEffect } from 'react';
import { User, Store, ArrowRight, CheckCircle, ChevronLeft, Bike, MapPin, Package, FileText, Clock, ShieldCheck, Smartphone, ChevronRight, Car, Check, Camera, Upload, DollarSign, Navigation, Search, Star, Zap, Globe, Cpu, TrendingUp, ImagePlus } from 'lucide-react';
import { UserType } from '../types';

interface OnboardingProps {
  onLogin: (type: UserType) => void;
}

type Step = 'landing' | 'driver-register-phone' | 'driver-register-otp' | 'driver-register-data' | 'driver-register-vehicle' | 'driver-register-docs' | 'pending-approval' | 'store-landing' | 'login-select';

const Onboarding: React.FC<OnboardingProps> = ({ onLogin }) => {
  const [step, setStep] = useState<Step>('landing');
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado para controlar a aba de "Como funciona"
  const [howItWorksTab, setHowItWorksTab] = useState<'driver' | 'client'>('driver');

  // --- ESTADOS DO CADASTRO ENTREGADOR ---
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [driverData, setDriverData] = useState({
    name: '',
    cpf: '',
    email: ''
  });
  const [selectedVehicle, setSelectedVehicle] = useState<'Moto' | 'Bike' | 'Carro' | null>(null);
  const [files, setFiles] = useState<{cnh: File | null, crlv: File | null, profile: File | null}>({
    cnh: null, 
    crlv: null,
    profile: null
  });

  // --- ESTADOS DO CADASTRO LOJA ---
  const [storeData, setStoreData] = useState({
    name: '',
    email: '',
    address: ''
  });
  const [storeLogo, setStoreLogo] = useState<File | null>(null);
  const [storeLogoPreview, setStoreLogoPreview] = useState<string | null>(null);

  // --- FUNÇÕES AUXILIARES ---

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ''); // Remove tudo que não é dígito
    if (value.length > 11) value = value.slice(0, 11); // Limita a 11 dígitos

    // Aplica a máscara (XX) XXXXX-XXXX
    if (value.length > 10) {
      value = value.replace(/^(\d\d)(\d{5})(\d{4}).*/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/^(\d\d)(\d{4})(\d{0,4}).*/, '($1) $2-$3');
    } else if (value.length > 2) {
      value = value.replace(/^(\d\d)(\d{0,5}).*/, '($1) $2');
    }
    
    setPhone(value);
  };

  const handleSendSms = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, '');
    if(cleanPhone.length < 10) return alert("Digite um número válido com DDD");
    
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('driver-register-otp');
    }, 1500);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if(otp !== '1234') return alert("Código inválido (use 1234)");
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('driver-register-data');
    }, 1000);
  };

  const handleSaveData = (e: React.FormEvent) => {
    e.preventDefault();
    setStep('driver-register-vehicle');
  };

  const handleSelectVehicle = (type: 'Moto' | 'Bike' | 'Carro') => {
    setSelectedVehicle(type);
    setTimeout(() => setStep('driver-register-docs'), 300);
  };

  const handleFileChange = (type: keyof typeof files, e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFiles(prev => ({ ...prev, [type]: e.target.files![0] }));
    }
  };

  const handleFinalSubmit = () => {
    if(!files.profile) return alert("A foto de perfil é obrigatória");
    if(selectedVehicle === 'Moto' && !files.cnh) return alert("CNH é obrigatória para motos");

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('pending-approval');
    }, 2500);
  };

  // --- FUNÇÕES LOJA ---
  const handleStoreLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoreLogo(file);
      setStoreLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleStoreRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeLogo) return alert("É obrigatório enviar a Logo do estabelecimento.");
    
    setIsLoading(true);

    // Simula conversão para Base64 para salvar no localStorage (para o StorePanel ler)
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Logo = reader.result as string;
      const finalData = {
        ...storeData,
        logo: base64Logo
      };
      
      localStorage.setItem('neo_store_data', JSON.stringify(finalData));
      
      setTimeout(() => {
        setIsLoading(false);
        onLogin('store');
      }, 1500);
    };
    reader.readAsDataURL(storeLogo);
  };

  const handleGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setStoreData(prev => ({...prev, address: `Lat: ${position.coords.latitude}, Lng: ${position.coords.longitude}`}));
        // Simulação de reverso geocoding
        setTimeout(() => {
           setStoreData(prev => ({...prev, address: "Av. Paulista, 1578 - Bela Vista, São Paulo"}));
        }, 1000);
      }, (error) => {
        alert("Erro ao obter localização. Digite manualmente.");
      });
    } else {
      alert("Geolocalização não suportada.");
    }
  };

  // --- HEADER COMUM ---
  const Header = ({ showBack = true, title = "", dark = false }) => (
    <div className={`flex items-center justify-between p-4 border-b sticky top-0 z-50 backdrop-blur-md ${dark ? 'bg-slate-950/80 border-white/10 text-white' : 'bg-white/90 border-gray-100 text-gray-900'}`}>
       <div className="flex items-center">
          {showBack && (
            <button onClick={() => setStep('landing')} className={`mr-4 p-1 rounded-full ${dark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
               <ChevronLeft size={24} className={dark ? 'text-white' : 'text-[#EA1D2C]'}/>
            </button>
          )}
          {title ? (
             <span className="font-bold text-lg">{title}</span>
          ) : (
             <div className="flex items-center gap-1 group cursor-pointer" onClick={() => setStep('landing')}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#EA1D2C] to-orange-600 flex items-center justify-center shadow-lg shadow-red-500/20">
                   <Zap size={18} className="text-white fill-white" />
                </div>
                <span className={`text-2xl font-black tracking-tighter ${dark ? 'text-white' : 'text-gray-900'} ml-2`}>
                   Neo<span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA1D2C] to-orange-500">Delivery</span>
                </span>
             </div>
          )}
       </div>
       <div className="flex items-center gap-3">
          {step === 'landing' && (
             <button onClick={() => setStep('store-landing')} className={`hidden md:block text-xs font-bold px-4 py-2 rounded-full border transition-all ${dark ? 'border-white/20 text-gray-300 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
               Sou Restaurante
             </button>
          )}
          <button onClick={() => setStep('login-select')} className="text-sm font-bold bg-[#EA1D2C] hover:bg-red-600 text-white px-5 py-2.5 rounded-full transition-all shadow-lg shadow-red-500/30 hover:shadow-red-500/50">
             Entrar
          </button>
       </div>
    </div>
  );

  // --------------------------------------------------------------------------------
  // 1. LANDING PAGE (FUTURISTA / DARK MODE)
  // --------------------------------------------------------------------------------
  if (step === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 font-sans text-white overflow-x-hidden selection:bg-red-500/30">
         <Header showBack={false} dark={true} />
         
         {/* Background Effects */}
         <div className="fixed inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#EA1D2C] rounded-full blur-[120px] opacity-10 animate-pulse"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-blue-600 rounded-full blur-[120px] opacity-10 animate-pulse delay-1000"></div>
            <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] bg-purple-600 rounded-full blur-[100px] opacity-10"></div>
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150"></div>
         </div>

         {/* Hero Section */}
         <div className="relative pt-20 pb-32 px-6">
            <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
               <div className="space-y-8 relative z-10">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                     <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                     <span className="text-xs font-bold tracking-widest text-gray-400 uppercase">Plataforma 3.0 Ativa</span>
                  </div>
                  
                  <h1 className="text-5xl md:text-7xl font-black leading-[0.95] tracking-tight">
                     O Futuro da <br/>
                     <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#EA1D2C] via-orange-500 to-yellow-500">Logística Urbana.</span>
                  </h1>
                  
                  <p className="text-lg text-gray-400 leading-relaxed max-w-lg">
                     Conectamos entregadores de elite e restaurantes premium através de inteligência artificial. Ganhos maximizados, rotas otimizadas e pagamento instantâneo.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-4 pt-4">
                     <button 
                        onClick={() => setStep('driver-register-phone')}
                        className="group relative px-8 py-4 bg-[#EA1D2C] rounded-full font-bold text-lg overflow-hidden transition-all hover:scale-105 shadow-[0_0_40px_-10px_rgba(234,29,44,0.5)]"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700"></div>
                        <span className="relative flex items-center gap-2">
                           Quero Entregar <ChevronRight size={20}/>
                        </span>
                     </button>
                     
                     <button 
                        onClick={() => setStep('store-landing')}
                        className="px-8 py-4 rounded-full font-bold text-lg border border-white/10 hover:bg-white/5 hover:border-white/30 transition-all flex items-center gap-2 backdrop-blur-sm"
                     >
                        Sou Restaurante
                     </button>
                  </div>

                  <div className="pt-8 flex items-center gap-6 text-sm text-gray-500 font-medium">
                     <div className="flex items-center gap-2">
                        <ShieldCheck size={18} className="text-green-500" /> Seguro Grátis
                     </div>
                     <div className="flex items-center gap-2">
                        <Zap size={18} className="text-yellow-500" /> Saque Imediato
                     </div>
                  </div>
               </div>
               
               {/* 3D/App Mockup Visual */}
               <div className="relative z-10 lg:h-[600px] flex items-center justify-center">
                  <div className="relative w-[300px] h-[600px] bg-slate-900 rounded-[3rem] border-8 border-slate-800 shadow-2xl rotate-[-6deg] hover:rotate-0 transition-transform duration-700 overflow-hidden group">
                     {/* Screen Content Simulation */}
                     <div className="absolute inset-0 bg-slate-950 flex flex-col">
                        <div className="h-1/2 bg-gradient-to-b from-slate-900 to-slate-950 p-6 relative overflow-hidden">
                           <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'radial-gradient(#4f4f4f 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                           {/* Radar Effect */}
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#EA1D2C]/30 rounded-full animate-ping"></div>
                           <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 border border-[#EA1D2C]/50 rounded-full"></div>
                           
                           {/* Floating Pins */}
                           <div className="absolute top-1/3 left-1/4 bg-white p-2 rounded-xl shadow-lg animate-bounce">
                              <Store size={20} className="text-[#EA1D2C]" />
                           </div>
                           <div className="absolute bottom-1/3 right-1/4 bg-[#EA1D2C] p-2 rounded-xl shadow-lg animate-bounce delay-700">
                              <User size={20} className="text-white" />
                           </div>
                        </div>
                        <div className="h-1/2 bg-slate-950 p-6 space-y-4">
                           <div className="bg-slate-900/50 p-4 rounded-2xl border border-white/5">
                              <div className="flex justify-between mb-2">
                                 <div className="h-2 w-20 bg-slate-800 rounded"></div>
                                 <div className="h-2 w-10 bg-green-500/50 rounded"></div>
                              </div>
                              <div className="h-8 w-32 bg-slate-800 rounded mb-2"></div>
                              <div className="h-2 w-full bg-slate-800 rounded"></div>
                           </div>
                           <button className="w-full py-3 bg-[#EA1D2C] rounded-xl shadow-[0_0_20px_rgba(234,29,44,0.4)]"></button>
                        </div>
                     </div>
                     
                     {/* Reflection */}
                     <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-transparent pointer-events-none"></div>
                  </div>
                  
                  {/* Floating Cards Behind */}
                  <div className="absolute top-20 right-0 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl animate-float">
                     <div className="flex items-center gap-3">
                        <div className="bg-green-500/20 p-2 rounded-lg text-green-500"><TrendingUp size={24} /></div>
                        <div>
                           <p className="text-xs text-gray-400 uppercase">Ganhos Hoje</p>
                           <p className="text-xl font-bold text-white">R$ 284,50</p>
                        </div>
                     </div>
                  </div>

                  <div className="absolute bottom-40 left-[-20px] bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-xl animate-float delay-500">
                     <div className="flex items-center gap-3">
                        <div className="bg-blue-500/20 p-2 rounded-lg text-blue-500"><Navigation size={24} /></div>
                        <div>
                           <p className="text-xs text-gray-400 uppercase">Rota Otimizada</p>
                           <p className="text-sm font-bold text-white">Economia de 15%</p>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Live Stats Strip */}
         <div className="border-y border-white/5 bg-white/[0.02] backdrop-blur-sm">
            <div className="max-w-6xl mx-auto py-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/5">
               <div>
                  <p className="text-3xl font-black text-white">50k+</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Parceiros</p>
               </div>
               <div>
                  <p className="text-3xl font-black text-white">2.5M</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Entregas/Mês</p>
               </div>
               <div>
                  <p className="text-3xl font-black text-white">R$ 18Mi</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Repassados</p>
               </div>
               <div>
                  <p className="text-3xl font-black text-white">4.9/5</p>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Avaliação App</p>
               </div>
            </div>
         </div>

         {/* Footer - ADMIN SECRET ACCESS */}
         <div className="border-t border-white/10 bg-black py-12 px-6">
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
               <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded bg-white/10 flex items-center justify-center">
                      <Zap size={16} className="text-white"/>
                   </div>
                   <span className="font-bold text-white tracking-widest uppercase text-sm">NeoDelivery Inc.</span>
               </div>
               <div className="flex gap-6 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <button onClick={() => {
                     const pwd = prompt("Senha de Acesso:");
                     if(pwd === "admin123") onLogin('admin');
                     else alert("Acesso negado");
                  }} className="hover:text-white transition-colors">Admin Console</button>
                  <button onClick={() => setStep('store-landing')} className="hover:text-white transition-colors">Partner Portal</button>
                  <button className="hover:text-white transition-colors">Privacy Policy</button>
               </div>
               <p className="text-xs text-gray-700">© 2024 NeoSystem. All rights reserved.</p>
            </div>
         </div>

         <style>{`
            @keyframes float {
               0%, 100% { transform: translateY(0); }
               50% { transform: translateY(-20px); }
            }
            .animate-float { animation: float 6s ease-in-out infinite; }
         `}</style>
      </div>
    );
  }

  // --------------------------------------------------------------------------------
  // MANTENDO O RESTANTE DO CÓDIGO (WIZARD DE CADASTRO) IGUAL
  // Apenas garantindo que o visual "clean" retorne nos formulários para legibilidade
  // --------------------------------------------------------------------------------

  // Passo 1: Telefone
  if (step === 'driver-register-phone') {
     return (
        <div className="min-h-screen bg-white font-sans animate-fade-in">
           <Header title="Cadastro" />
           <div className="max-w-md mx-auto px-6 py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Qual é o seu celular?</h1>
              <p className="text-gray-500 mb-8">Vamos enviar um código de confirmação para você.</p>
              
              <form onSubmit={handleSendSms}>
                 <div className="relative mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase absolute top-2 left-3">DDD + Celular</label>
                    <input 
                      autoFocus
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="w-full pt-7 pb-3 px-3 bg-gray-50 border-b-2 border-gray-300 focus:border-[#EA1D2C] outline-none text-lg font-medium rounded-t-lg transition-colors tracking-wide"
                      placeholder="(00) 00000-0000"
                    />
                 </div>
                 <button 
                   disabled={isLoading}
                   className="w-full py-4 bg-[#EA1D2C] text-white rounded-full font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isLoading ? 'Enviando...' : 'Continuar'} <ArrowRight size={20} />
                 </button>
              </form>
           </div>
        </div>
     );
  }

  // Passo 2: OTP
  if (step === 'driver-register-otp') {
     return (
        <div className="min-h-screen bg-white font-sans animate-fade-in">
           <Header title="Verificação" />
           <div className="max-w-md mx-auto px-6 py-12">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Digite o código</h1>
              <p className="text-gray-500 mb-8">Enviamos para {phone}. <span className="text-[#EA1D2C] font-bold cursor-pointer" onClick={() => setStep('driver-register-phone')}>Alterar</span></p>
              
              <form onSubmit={handleVerifyOtp}>
                 <div className="relative mb-6">
                    <label className="text-xs font-bold text-gray-400 uppercase absolute top-2 left-3">Código de 4 dígitos</label>
                    <input 
                      autoFocus
                      type="text" 
                      maxLength={4}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pt-7 pb-3 px-3 bg-gray-50 border-b-2 border-gray-300 focus:border-[#EA1D2C] outline-none text-lg font-medium rounded-t-lg transition-colors tracking-[0.5em]"
                      placeholder="0000"
                    />
                    <p className="text-xs text-gray-400 mt-2">Dica: use 1234 para teste.</p>
                 </div>
                 <button 
                   disabled={isLoading}
                   className="w-full py-4 bg-[#EA1D2C] text-white rounded-full font-bold text-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                    {isLoading ? 'Validando...' : 'Confirmar'}
                 </button>
              </form>
           </div>
        </div>
     );
  }

  // Passo 3: Dados Básicos
  if (step === 'driver-register-data') {
     return (
        <div className="min-h-screen bg-white font-sans animate-fade-in">
           <Header title="Seus Dados" />
           <div className="max-w-md mx-auto px-6 py-8">
              <div className="mb-8">
                 <div className="flex gap-2 mb-2">
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                 </div>
                 <p className="text-xs text-gray-400 font-bold text-right">Etapa 1 de 3</p>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-6">Vamos nos conhecer</h1>
              
              <form onSubmit={handleSaveData} className="space-y-4">
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Nome Completo</label>
                    <input 
                      required
                      type="text" 
                      value={driverData.name}
                      onChange={(e) => setDriverData({...driverData, name: e.target.value})}
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#EA1D2C] outline-none transition-colors"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">CPF</label>
                    <input 
                      required
                      type="text" 
                      value={driverData.cpf}
                      onChange={(e) => setDriverData({...driverData, cpf: e.target.value})}
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#EA1D2C] outline-none transition-colors"
                      placeholder="000.000.000-00"
                    />
                 </div>
                 <div>
                    <label className="text-xs font-bold text-gray-500 uppercase mb-1 block">Email</label>
                    <input 
                      required
                      type="email" 
                      value={driverData.email}
                      onChange={(e) => setDriverData({...driverData, email: e.target.value})}
                      className="w-full p-3 bg-gray-50 rounded-lg border border-gray-200 focus:border-[#EA1D2C] outline-none transition-colors"
                    />
                 </div>
                 <button className="w-full mt-6 py-4 bg-[#EA1D2C] text-white rounded-full font-bold text-lg hover:bg-red-700 transition-colors">
                    Próximo
                 </button>
              </form>
           </div>
        </div>
     );
  }

  // Passo 4: Veículo
  if (step === 'driver-register-vehicle') {
     return (
        <div className="min-h-screen bg-white font-sans animate-fade-in">
           <Header title="Veículo" />
           <div className="max-w-md mx-auto px-6 py-8">
              <div className="mb-8">
                 <div className="flex gap-2 mb-2">
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                    <div className="h-1 flex-1 bg-gray-200 rounded-full"></div>
                 </div>
                 <p className="text-xs text-gray-400 font-bold text-right">Etapa 2 de 3</p>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Como você vai entregar?</h1>
              <p className="text-gray-500 mb-8">Escolha o veículo principal.</p>
              
              <div className="grid gap-4">
                 <button 
                   onClick={() => handleSelectVehicle('Moto')}
                   className="flex items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-[#EA1D2C] hover:bg-red-50 transition-all group text-left"
                 >
                    <div className="bg-gray-100 p-4 rounded-full mr-4 group-hover:bg-white transition-colors">
                       <Car size={24} className="text-gray-600 group-hover:text-[#EA1D2C]"/>
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-gray-900">Moto</h3>
                       <p className="text-sm text-gray-500">Precisa de CNH A e CRLV em dia.</p>
                    </div>
                 </button>

                 <button 
                   onClick={() => handleSelectVehicle('Bike')}
                   className="flex items-center p-6 rounded-2xl border-2 border-gray-100 hover:border-[#EA1D2C] hover:bg-red-50 transition-all group text-left"
                 >
                    <div className="bg-gray-100 p-4 rounded-full mr-4 group-hover:bg-white transition-colors">
                       <Bike size={24} className="text-gray-600 group-hover:text-[#EA1D2C]"/>
                    </div>
                    <div>
                       <h3 className="font-bold text-lg text-gray-900">Bicicleta</h3>
                       <p className="text-sm text-gray-500">Precisa apenas de um RG válido.</p>
                    </div>
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // Passo 5: Documentos
  if (step === 'driver-register-docs') {
     return (
        <div className="min-h-screen bg-white font-sans animate-fade-in">
           <Header title="Documentos" />
           <div className="max-w-md mx-auto px-6 py-8">
              <div className="mb-8">
                 <div className="flex gap-2 mb-2">
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                    <div className="h-1 flex-1 bg-[#EA1D2C] rounded-full"></div>
                 </div>
                 <p className="text-xs text-gray-400 font-bold text-right">Etapa 3 de 3</p>
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-6">Envie suas fotos</h1>
              
              <div className="space-y-4">
                 {/* Foto de Perfil */}
                 <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <div className="bg-gray-100 p-2 rounded-lg"><Camera size={20} className="text-gray-600"/></div>
                       <div>
                          <p className="font-bold text-sm text-gray-900">Foto de Rosto (Selfie)</p>
                          <p className="text-xs text-gray-400">{files.profile ? 'Foto anexada' : 'Obrigatório'}</p>
                       </div>
                    </div>
                    <label className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${files.profile ? 'bg-green-100 text-green-700' : 'bg-[#EA1D2C] text-white hover:bg-red-700'}`}>
                       {files.profile ? 'Alterar' : 'Enviar'}
                       <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('profile', e)} />
                    </label>
                 </div>

                 {/* CNH (Apenas Moto/Carro) */}
                 {selectedVehicle !== 'Bike' && (
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-lg"><FileText size={20} className="text-gray-600"/></div>
                          <div>
                             <p className="font-bold text-sm text-gray-900">CNH Aberta</p>
                             <p className="text-xs text-gray-400">{files.cnh ? 'Documento anexado' : 'Obrigatório p/ Moto'}</p>
                          </div>
                       </div>
                       <label className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${files.cnh ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                          {files.cnh ? 'Alterar' : 'Enviar'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('cnh', e)} />
                       </label>
                    </div>
                 )}

                 {/* CRLV (Apenas Moto/Carro) */}
                 {selectedVehicle !== 'Bike' && (
                    <div className="border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                       <div className="flex items-center gap-3">
                          <div className="bg-gray-100 p-2 rounded-lg"><FileText size={20} className="text-gray-600"/></div>
                          <div>
                             <p className="font-bold text-sm text-gray-900">Doc. Veículo (CRLV)</p>
                             <p className="text-xs text-gray-400">{files.crlv ? 'Documento anexado' : 'Exercício Vigente'}</p>
                          </div>
                       </div>
                       <label className={`px-4 py-2 rounded-full text-xs font-bold cursor-pointer transition-colors ${files.crlv ? 'bg-green-100 text-green-700' : 'bg-gray-900 text-white hover:bg-gray-700'}`}>
                          {files.crlv ? 'Alterar' : 'Enviar'}
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileChange('crlv', e)} />
                       </label>
                    </div>
                 )}

                 {selectedVehicle === 'Bike' && (
                    <div className="bg-blue-50 p-4 rounded-xl text-sm text-blue-800 flex items-start gap-2">
                       <ShieldCheck size={16} className="mt-0.5 shrink-0"/>
                       Para Bike, precisamos apenas que sua Selfie esteja nítida e segurando seu RG ao lado do rosto.
                    </div>
                 )}
              </div>

              <div className="mt-8">
                 <button 
                   onClick={handleFinalSubmit}
                   disabled={isLoading}
                   className="w-full py-4 bg-[#EA1D2C] text-white rounded-full font-bold text-lg shadow-lg hover:bg-red-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                 >
                   {isLoading ? 'Enviando...' : 'Finalizar Cadastro'}
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // PENDING APPROVAL (Sucesso)
  if (step === 'pending-approval') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-center animate-fade-in font-sans">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-8 animate-bounce">
          <CheckCircle className="text-green-600" size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Recebemos tudo!</h2>
        <p className="text-gray-500 mb-8 max-w-xs mx-auto leading-relaxed">
          Seus dados foram enviados para análise. Em até 48h você receberá uma resposta por email/SMS.
        </p>
        
        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 max-w-sm w-full mb-8 text-left">
           <p className="text-xs text-gray-400 uppercase font-bold mb-2">Resumo</p>
           <p className="font-bold text-gray-900">{driverData.name}</p>
           <p className="text-sm text-gray-500">Veículo: {selectedVehicle}</p>
        </div>

        <button onClick={() => onLogin('driver')} className="w-full max-w-xs py-3 bg-gray-900 text-white rounded-full font-semibold hover:bg-gray-800 transition-colors">
          Acessar modo Demo (Entregador)
        </button>
      </div>
    );
  }

  // LOGIN SELECT (Entrar)
  if (step === 'login-select') {
     return (
        <div className="min-h-screen bg-white animate-fade-in font-sans">
           <Header title="Entrar" />
           <div className="p-6 max-w-md mx-auto pt-12">
              <h1 className="text-3xl font-bold text-gray-900 mb-8">Como deseja acessar?</h1>
              
              <div className="space-y-4">
                 <button onClick={() => onLogin('driver')} className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center gap-4 hover:border-[#EA1D2C] transition-all group shadow-sm hover:shadow-xl">
                    <div className="bg-red-50 p-3 rounded-full group-hover:bg-[#EA1D2C] transition-colors">
                       <Bike size={24} className="text-[#EA1D2C] group-hover:text-white"/>
                    </div>
                    <div className="text-left">
                       <h3 className="font-bold text-lg text-gray-900">Sou Entregador</h3>
                       <p className="text-xs text-gray-500">Acessar painel de corridas</p>
                    </div>
                    <ChevronRight className="ml-auto text-gray-300 group-hover:text-red-300" />
                 </button>

                 <button onClick={() => onLogin('store')} className="w-full p-4 bg-white border-2 border-gray-100 rounded-2xl flex items-center gap-4 hover:border-[#EA1D2C] transition-all group shadow-sm hover:shadow-xl">
                    <div className="bg-red-50 p-3 rounded-full group-hover:bg-[#EA1D2C] transition-colors">
                       <Store size={24} className="text-[#EA1D2C] group-hover:text-white"/>
                    </div>
                    <div className="text-left">
                       <h3 className="font-bold text-lg text-gray-900">Sou Restaurante</h3>
                       <p className="text-xs text-gray-500">Gerenciar pedidos e loja</p>
                    </div>
                    <ChevronRight className="ml-auto text-gray-300 group-hover:text-red-300" />
                 </button>
              </div>
           </div>
        </div>
     );
  }

  // STORE LANDING (CADASTRO DE RESTAURANTE)
  if (step === 'store-landing') {
    return (
      <div className="min-h-screen bg-white font-sans animate-fade-in">
        <Header title="Para Restaurantes" />
        <div className="max-w-md mx-auto px-6 py-12">
           <h1 className="text-3xl font-bold text-gray-900 mb-4">Restaurante fazer o cadastro</h1>
           <p className="text-gray-500 mb-8">Comece a entregar hoje mesmo com nossa frota de parceiros.</p>
           
           <form onSubmit={handleStoreRegister} className="space-y-4">
              <div className="space-y-2">
                 <label className="text-xs font-bold text-gray-500 uppercase">Logo da Loja (Obrigatório)</label>
                 <div className="flex items-center gap-4">
                    <label className="w-24 h-24 bg-gray-100 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors border-2 border-dashed border-gray-300 overflow-hidden relative">
                       {storeLogoPreview ? (
                          <img src={storeLogoPreview} alt="Logo Preview" className="w-full h-full object-cover" />
                       ) : (
                          <>
                             <ImagePlus className="text-gray-400 mb-1" size={24} />
                             <span className="text-[10px] text-gray-500 font-bold">Adicionar</span>
                          </>
                       )}
                       <input type="file" accept="image/*" className="hidden" onChange={handleStoreLogoChange} />
                    </label>
                    <div className="flex-1">
                       <p className="text-sm text-gray-600 leading-tight mb-1">Sua marca visível no mapa para milhares de clientes.</p>
                       <p className="text-[10px] text-red-500 font-bold">* Upload Obrigatório</p>
                    </div>
                 </div>
              </div>

              <input 
                type="text" 
                placeholder="Nome do Restaurante" 
                value={storeData.name}
                onChange={(e) => setStoreData({...storeData, name: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-red-500" 
                required 
              />
              <input 
                type="email" 
                placeholder="Email comercial" 
                value={storeData.email}
                onChange={(e) => setStoreData({...storeData, email: e.target.value})}
                className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-red-500" 
                required 
              />
              
              <div className="relative">
                 <input 
                   type="text" 
                   placeholder="Endereço completo" 
                   value={storeData.address}
                   onChange={(e) => setStoreData({...storeData, address: e.target.value})}
                   className="w-full p-3 bg-gray-50 rounded-lg border-none focus:ring-2 focus:ring-red-500" 
                   required 
                 />
                 <button type="button" onClick={handleGeolocation} className="absolute right-2 top-2 text-gray-400 hover:text-red-600 p-1">
                    <Navigation size={20} />
                 </button>
              </div>

              <button 
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-[#EA1D2C] text-white rounded-full font-bold hover:bg-red-700 shadow-lg shadow-red-200 flex items-center justify-center gap-2 disabled:opacity-70"
              >
                 {isLoading ? 'Processando...' : 'Cadastrar Agora'}
              </button>
           </form>
        </div>
      </div>
    )
  }

  // Fallback
  return (
     <div className="p-10 text-center">
        <p>Carregando...</p>
        <button onClick={() => setStep('landing')} className="text-blue-500 underline">Voltar</button>
     </div>
  );
};

export default Onboarding;
