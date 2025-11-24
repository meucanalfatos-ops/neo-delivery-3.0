
import React, { useState } from 'react';
import { Search, MapPin, Star, Clock, Sparkles, Send, ExternalLink, Loader2, Navigation, ChevronLeft } from 'lucide-react';
import { MOCK_STORES } from '../constants';
import { findNearbyPlaces, MapsResponse } from '../services/geminiService';

interface StoresProps {
  onBack?: () => void;
}

const Stores: React.FC<StoresProps> = ({ onBack }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [mode, setMode] = useState<'list' | 'ai'>('list');
  
  // AI State
  const [aiQuery, setAiQuery] = useState('');
  const [aiResult, setAiResult] = useState<MapsResponse | null>(null);
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  const filteredStores = MOCK_STORES.filter(store => 
    store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    store.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'open': return { color: 'text-green-600', bg: 'bg-green-50', label: 'Aberto' };
      case 'busy': return { color: 'text-red-600', bg: 'bg-red-50', label: 'Alta Demanda' };
      case 'closed': return { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Fechado' };
      default: return { color: 'text-gray-500', bg: 'bg-gray-100', label: 'Indefinido' };
    }
  };

  const handleAiSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiQuery.trim()) return;
    
    setIsLoadingAi(true);
    setAiResult(null);

    const callService = async (lat: number, lng: number) => {
       const result = await findNearbyPlaces(aiQuery, lat, lng);
       setAiResult(result);
       setIsLoadingAi(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => callService(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.error(err);
          callService(-23.5505, -46.6333);
        }
      );
    } else {
      callService(-23.5505, -46.6333);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans animate-fade-in">
      <div className="bg-white sticky top-0 z-10 border-b border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <h1 className="text-xl font-bold text-gray-900">Lojas Parceiras</h1>
        </div>
        
        <div className="flex bg-gray-100 p-1 rounded-xl">
            <button 
              onClick={() => setMode('list')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              Lista
            </button>
            <button 
              onClick={() => setMode('ai')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 ${mode === 'ai' ? 'bg-purple-100 text-purple-700 shadow-sm' : 'text-gray-500'}`}
            >
              <Sparkles size={12} /> Radar IA
            </button>
         </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {/* Search Bar for List Mode */}
        {mode === 'list' && (
          <div className="relative animate-fade-in mb-4">
            <Search className="absolute left-3 top-3.5 text-gray-400" size={20} />
            <input 
              type="text" 
              placeholder="Buscar restaurante..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 p-3 bg-white rounded-xl shadow-sm border border-gray-100 focus:ring-2 focus:ring-red-500 outline-none transition-all"
            />
          </div>
        )}

        {/* --- AI RADAR MODE --- */}
        {mode === 'ai' && (
          <div className="flex flex-col animate-fade-in">
             <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 mb-4">
                <div className="flex items-start gap-3 mb-2">
                   <div className="bg-purple-100 p-2 rounded-lg text-purple-600">
                      <Sparkles size={20} />
                   </div>
                   <div>
                      <h3 className="font-bold text-purple-900">Radar Inteligente</h3>
                      <p className="text-xs text-purple-700 mt-1">
                         Use a IA do Google Maps para encontrar postos, restaurantes abertos ou áreas de alta demanda ao seu redor.
                      </p>
                   </div>
                </div>
             </div>

             <form onSubmit={handleAiSearch} className="relative mb-6">
                <input 
                  type="text"
                  value={aiQuery}
                  onChange={(e) => setAiQuery(e.target.value)}
                  placeholder="Ex: Postos de gasolina baratos perto de mim"
                  className="w-full p-4 pr-14 bg-white rounded-xl shadow-lg border border-purple-100 focus:ring-2 focus:ring-purple-500 outline-none"
                />
                <button 
                  type="submit"
                  disabled={isLoadingAi || !aiQuery.trim()}
                  className="absolute right-2 top-2 bottom-2 bg-purple-600 hover:bg-purple-700 text-white px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                   {isLoadingAi ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                </button>
             </form>

             {/* AI Results */}
             <div className="space-y-4 pb-20">
                {aiResult && (
                   <div className="animate-fade-in space-y-4">
                      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                         <div className="prose prose-sm text-gray-700 max-w-none whitespace-pre-line">
                            {aiResult.text}
                         </div>
                      </div>

                      {aiResult.chunks.length > 0 && (
                         <div>
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 ml-1">Locais Encontrados</h4>
                            <div className="grid gap-3">
                               {aiResult.chunks.map((chunk, idx) => {
                                  const mapData = chunk.maps;
                                  const webData = chunk.web;
                                  const uri = mapData?.uri || webData?.uri;
                                  const title = mapData?.title || webData?.title || 'Local no Mapa';
                                  
                                  if (!uri) return null;

                                  return (
                                     <a 
                                       key={idx} 
                                       href={uri} 
                                       target="_blank" 
                                       rel="noopener noreferrer"
                                       className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-purple-200 transition-colors group"
                                     >
                                        <div className="flex items-center gap-3">
                                           <div className="bg-red-50 text-red-500 p-2 rounded-lg group-hover:bg-red-100 transition-colors">
                                              <MapPin size={18} />
                                           </div>
                                           <span className="font-medium text-gray-800 text-sm">{title}</span>
                                        </div>
                                        <ExternalLink size={16} className="text-gray-400 group-hover:text-purple-500" />
                                     </a>
                                  );
                               })}
                            </div>
                         </div>
                      )}
                   </div>
                )}
             </div>
          </div>
        )}

        {/* --- LIST MODE --- */}
        {mode === 'list' && (
          <div className="space-y-4 animate-fade-in">
            {filteredStores.map((store) => {
              const statusConfig = getStatusConfig(store.status);
              
              return (
                <div key={store.id} className="bg-white p-3 rounded-2xl shadow-sm border border-gray-100 flex gap-4 transition-transform active:scale-[0.99]">
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-100">
                    <img src={store.imageUrl} alt={store.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-gray-900 text-base leading-tight">{store.name}</h3>
                        <div className="flex items-center gap-1 bg-yellow-50 px-1.5 py-0.5 rounded text-xs font-bold text-yellow-700">
                          <Star size={10} fill="currentColor" /> {store.rating}
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">{store.category} • {store.address}</p>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${statusConfig.bg} ${statusConfig.color} flex items-center gap-1`}>
                        <Clock size={10} /> {statusConfig.label}
                      </span>
                      
                      <div className="flex items-center text-xs text-gray-500 font-medium">
                        <MapPin size={12} className="mr-1 text-gray-400" />
                        {store.distance}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Stores;
