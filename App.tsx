
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, Trash2, PieChart, Sparkles, Package, Tag, Weight, Euro, Share2, Globe, User, ChevronLeft, Copy, Check, Users, Scale, Utensils, Mountain, Map, Info, Clock, ArrowUpRight, Search, Tent, Moon, Shirt, Flame, Smartphone, Droplets, Apple, RefreshCw, X, UserPlus, ExternalLink, Save, Download, AlertTriangle } from 'lucide-react';
import { GearItem, Category, PackStats, Language, Trip, ParticipantPack } from './types';
import { supabase } from './services/supabase';
import { translations } from './translations';
import WeightChart from './components/WeightChart';
import AIInsights from './components/AIInsights';

// Fallback for environments where crypto.randomUUID is not available
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

// UTF-8 safe Base64 encoding/decoding
const toBase64 = (str: string) => btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (match, p1) => String.fromCharCode(parseInt(p1, 16))));
const fromBase64 = (str: string) => decodeURIComponent(atob(str).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));

// Helper to ensure links are absolute
const ensureProtocol = (url: string) => {
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) {
    return `https://${url}`;
  }
  return url;
};

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('packwise-lang');
    return (saved as Language) || 'en';
  });

  const [trip, setTrip] = useState<Trip | null>(null);
  const [activeParticipantId, setActiveParticipantId] = useState<string | null>(null);
  const [isViewOnly, setIsViewOnly] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'list' | 'stats' | 'ai'>('list');
  const [copySuccess, setCopySuccess] = useState(false);
  
  // Creation Flow State
  const [isCreating, setIsCreating] = useState(false);
  const [newTripName, setNewTripName] = useState('');
  const [newTripLeader, setNewTripLeader] = useState('');
  const [newTripUrl, setNewTripUrl] = useState('');
  const [initialParticipants, setInitialParticipants] = useState<string[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');

  const t = translations[language];

  // Load from Supabase (Shared) or LocalStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('id');

    if (tripId) {
      // Fetch from Cloud
      const fetchTrip = async () => {
        const { data, error } = await supabase
          .from('trips')
          .select('trip_data')
          .eq('id', tripId)
          .single();

        if (data && data.trip_data) {
          setTrip(data.trip_data);
          setIsViewOnly(false); // Enable editing for everyone
          if (data.trip_data.participants?.length > 0) {
             setActiveParticipantId(data.trip_data.participants[0].id);
          }

          // Enable Realtime Updates (Sync with friends)
          supabase
            .channel('trip_updates')
            .on('postgres_changes', 
              { event: 'UPDATE', schema: 'public', table: 'trips', filter: `id=eq.${tripId}` }, 
              (payload) => { setTrip(payload.new.trip_data); }
            )
            .subscribe();
        }
      };
      fetchTrip();
    } else {
      loadLocalData();
    }
  }, []);

  const loadLocalData = () => {
    const savedTrip = localStorage.getItem('packwise-trip');
    if (savedTrip) {
      try {
        const parsed = JSON.parse(savedTrip);
        setTrip(parsed);
        if (parsed.participants && parsed.participants.length > 0) {
           setActiveParticipantId(parsed.participants[0].id);
        }
      } catch (e) {
        console.error("Failed to parse local data", e);
      }
    }
    setIsViewOnly(false);
  };

  // Auto-save to Supabase (and local backup)
  useEffect(() => {
    if (!trip) return;

    // Always save local preferences
    localStorage.setItem('packwise-lang', language);

    const params = new URLSearchParams(window.location.search);
    const tripId = params.get('id');

    if (tripId) {
      // Debounce save to Cloud (Wait 1s after typing stops)
      const timeoutId = setTimeout(async () => {
        await supabase.from('trips').update({ trip_data: trip }).eq('id', tripId);
      }, 1000);
      return () => clearTimeout(timeoutId);
    } else {
       // Local backup if not on cloud yet
       localStorage.setItem('packwise-trip', JSON.stringify(trip));
    }
  }, [trip, language]);

  const activeParticipant = useMemo(() => {
    return trip?.participants.find(p => p.id === activeParticipantId) || null;
  }, [trip, activeParticipantId]);

  const calculatePackStats = (items: GearItem[]): PackStats => {
    return items.reduce((acc, item) => {
      const itemTotalWeight = item.weight * item.quantity;
      const itemTotalPrice = item.price * item.quantity;
      acc.totalWeight += itemTotalWeight;
      acc.totalPrice += itemTotalPrice;
      if (item.isConsumable) acc.consumableWeight += itemTotalWeight;
      if (item.isWorn) acc.wornWeight += itemTotalWeight;
      else acc.baseWeight += itemTotalWeight;
      return acc;
    }, { totalWeight: 0, baseWeight: 0, wornWeight: 0, consumableWeight: 0, totalPrice: 0 });
  };

  const groupStats = useMemo(() => {
    if (!trip) return null;
    return trip.participants.map(p => ({
      participant: p,
      stats: calculatePackStats(p.items)
    }));
  }, [trip]);

  const totalGroupStats = useMemo(() => {
    if (!groupStats) return null;
    return groupStats.reduce((acc, curr) => ({
      totalWeight: acc.totalWeight + curr.stats.totalWeight,
      baseWeight: acc.baseWeight + curr.stats.baseWeight,
      wornWeight: acc.wornWeight + curr.stats.wornWeight,
      consumableWeight: acc.consumableWeight + curr.stats.consumableWeight,
      totalPrice: acc.totalPrice + curr.stats.totalPrice,
    }), { totalWeight: 0, baseWeight: 0, wornWeight: 0, consumableWeight: 0, totalPrice: 0 });
  }, [groupStats]);

  const addItem = (newItemData: Omit<GearItem, 'id'>) => {
    if (!trip || !activeParticipantId) return;
    const newItem = { ...newItemData, id: generateUUID() };
    setTrip({
      ...trip,
      participants: trip.participants.map(p => 
        p.id === activeParticipantId ? { ...p, items: [...p.items, newItem] } : p
      )
    });
    setShowAddModal(false);
  };

  const removeItem = (id: string) => {
    if (!trip || !activeParticipantId) return;
    setTrip({
      ...trip,
      participants: trip.participants.map(p => 
        p.id === activeParticipantId ? { ...p, items: p.items.filter(i => i.id !== id) } : p
      )
    });
  };

  const toggleStatus = (id: string, field: 'isWorn' | 'isConsumable') => {
    if (!trip || !activeParticipantId) return;
    setTrip({
      ...trip,
      participants: trip.participants.map(p => 
        p.id === activeParticipantId ? { 
          ...p, 
          items: p.items.map(item => item.id === id ? { ...item, [field]: !item[field] } : item) 
        } : p
      )
    });
  };

  const handleCreateTrip = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTripName || !newTripLeader) return;

    const participants: ParticipantPack[] = [{
      id: generateUUID(),
      ownerName: newTripLeader,
      items: []
    }];

    initialParticipants.forEach(name => {
      participants.push({
        id: generateUUID(),
        ownerName: name,
        items: []
      });
    });

    const newTrip: Trip = {
      id: generateUUID(),
      name: newTripName,
      leaderName: newTripLeader,
      routeUrl: newTripUrl,
      participants
    };

    // Create in Supabase
    const { data, error } = await supabase
      .from('trips')
      .insert([{ trip_data: newTrip }])
      .select()
      .single();

    if (data) {
      setTrip(newTrip);
      setActiveParticipantId(participants[0].id);
      setIsCreating(false);
      setIsViewOnly(false);
      // Update URL to include the new Cloud ID
      window.history.pushState({}, '', `?id=${data.id}`);
      setTimeout(() => setShowShareModal(true), 500);
    }
  };

  const makeEditable = () => {
    if (!trip) return;
    localStorage.setItem('packwise-trip', JSON.stringify(trip));
    setIsViewOnly(false);
    // Clear URL params to stop being in "view mode"
    window.history.replaceState({}, document.title, window.location.pathname);
  };

  const addParticipant = () => {
    if (!trip) return;
    const newId = generateUUID();
    setTrip({
      ...trip,
      participants: [...trip.participants, {
        id: newId,
        ownerName: `${t.ownerName} ${trip.participants.length + 1}`,
        items: []
      }]
    });
    setActiveParticipantId(newId);
  };

  const generateShareLink = () => {
    if (!trip) return '';
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    return id ? `${window.location.origin}${window.location.pathname}?id=${id}` : window.location.href;
  };

  const copyToClipboard = () => {
    const link = generateShareLink();
    navigator.clipboard.writeText(link).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  if (isCreating) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex flex-col p-6 items-center justify-center">
        <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-500">
          <button onClick={() => setIsCreating(false)} className="mb-8 flex items-center gap-2 text-slate-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-600 transition-all">
            <ChevronLeft size={16} /> Back
          </button>
          <div className="bg-white rounded-[3.5rem] p-10 shadow-2xl border border-slate-50">
             <h2 className="text-3xl font-black text-slate-900 mb-8 tracking-tight">{t.createTrip}</h2>
             <form onSubmit={handleCreateTrip} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">{t.tripName}</label>
                  <input 
                    required
                    value={newTripName}
                    onChange={e => setNewTripName(e.target.value)}
                    placeholder="e.g. Alps Summer Trek"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-4 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all font-black text-slate-800 placeholder:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">{t.tripLeader}</label>
                  <input 
                    required
                    value={newTripLeader}
                    onChange={e => setNewTripLeader(e.target.value)}
                    placeholder="Your Name"
                    className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-4 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all font-black text-slate-800 placeholder:text-slate-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">{t.routeUrl}</label>
                  <div className="relative">
                    <Map size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" />
                    <input 
                      value={newTripUrl}
                      onChange={e => setNewTripUrl(e.target.value)}
                      placeholder="https://mapy.cz/s/..."
                      className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] pl-16 pr-7 py-4 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-200"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-50">
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-widest ml-1">{t.addParticipant}</label>
                  <div className="flex gap-2">
                    <input 
                      value={newParticipantName}
                      onChange={e => setNewParticipantName(e.target.value)}
                      placeholder="Friend Name"
                      className="flex-1 bg-slate-50 border-2 border-slate-50 rounded-[1.2rem] px-5 py-3 outline-none transition-all font-bold text-slate-800 placeholder:text-slate-200"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          if (newParticipantName) {
                            setInitialParticipants([...initialParticipants, newParticipantName]);
                            setNewParticipantName('');
                          }
                        }
                      }}
                    />
                    <button 
                      type="button"
                      onClick={() => {
                        if (newParticipantName) {
                          setInitialParticipants([...initialParticipants, newParticipantName]);
                          setNewParticipantName('');
                        }
                      }}
                      className="p-3 bg-indigo-50 text-indigo-600 rounded-[1.2rem]"
                    >
                      <Plus size={20} />
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {initialParticipants.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-slate-500">
                        {p}
                        <button type="button" onClick={() => setInitialParticipants(initialParticipants.filter((_, idx) => idx !== i))}>
                          <X size={12} className="text-rose-400" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-2xl hover:bg-slate-800 transition-all uppercase tracking-[0.2em] text-[11px]">
                  {t.startTrip}
                </button>
             </form>
          </div>
        </div>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6">
        <div className="text-center max-w-sm w-full">
          <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] flex items-center justify-center shadow-2xl shadow-indigo-200 mx-auto mb-10 transform -rotate-6">
            <Mountain className="text-white w-12 h-12" />
          </div>
          <h1 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">{t.appName}</h1>
          <p className="text-slate-500 mb-10 font-medium px-4">The ultimate weight tracker for group treks. No accounts needed.</p>
          <button 
            onClick={() => setIsCreating(true)}
            className="w-full bg-slate-900 text-white font-black py-6 rounded-[2rem] shadow-xl hover:bg-slate-800 active:scale-95 transition-all uppercase tracking-widest text-sm"
          >
            {t.createTrip}
          </button>
          <button 
            onClick={() => setLanguage(language === 'en' ? 'sk' : 'en')}
            className="mt-8 flex items-center gap-2 mx-auto px-6 py-3 bg-white border border-slate-100 rounded-full text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-all uppercase tracking-widest shadow-sm"
          >
            <Globe size={14} /> {language === 'en' ? 'English' : 'Slovenčina'}
          </button>
        </div>
      </div>
    );
  }

  const getGroupedItems = (items: GearItem[]): Record<string, GearItem[]> => {
    return items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {} as Record<string, GearItem[]>);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col pb-28">
      {/* Collaboration Banner */}
      {isViewOnly && (
        <div className="bg-indigo-600 text-white px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg sticky top-0 z-40">
           <div className="flex items-center gap-3">
              <Info size={20} className="text-indigo-200 shrink-0" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest mb-0.5">{t.viewMode}</p>
                <p className="text-[10px] text-indigo-100 opacity-80">This is a read-only snapshot.</p>
              </div>
           </div>
           <button 
             onClick={makeEditable}
             className="bg-white text-indigo-600 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2 whitespace-nowrap"
           >
             <Save size={14} /> Save & Edit Pack
           </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-100 sticky top-0 z-30 px-4 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-4">
          {!isViewOnly && (
            <button onClick={() => setTrip(null)} className="w-11 h-11 bg-indigo-600 rounded-[1.2rem] flex items-center justify-center shadow-lg shadow-indigo-100">
              <Package className="text-white w-5 h-5" />
            </button>
          )}
          <div>
            <h1 className="text-lg font-black text-slate-900 leading-none mb-1">
              {trip.name}
            </h1>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.tripLeader}: {trip.leaderName}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {!isViewOnly && (
            <button 
              onClick={() => setShowShareModal(true)}
              className="p-3 text-indigo-600 hover:bg-indigo-50 bg-slate-50 rounded-2xl transition-all flex items-center gap-2 px-5"
            >
              <Share2 size={20} />
              <span className="hidden sm:inline text-[10px] font-black uppercase tracking-widest">{t.share}</span>
            </button>
          )}
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-5 pt-8">
        {/* Simple Reference Link Card */}
        {trip.routeUrl && (
          <section className="bg-white rounded-[2.5rem] p-7 mb-8 shadow-sm border border-slate-50 flex items-center justify-between group hover:border-indigo-100 transition-all">
             <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                   <Map size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{t.routeDetails}</h4>
                  <p className="text-sm font-black text-slate-800">Mapy.cz Track</p>
                </div>
             </div>
             <a href={ensureProtocol(trip.routeUrl)} target="_blank" rel="noopener noreferrer" className="bg-slate-900 text-white p-4 rounded-2xl shadow-xl hover:bg-indigo-600 transition-all active:scale-90">
                <ExternalLink size={20} />
             </a>
          </section>
        )}

        {/* Tab Selection */}
        <div className="flex gap-2 mb-8 bg-slate-100/50 p-1.5 rounded-3xl">
           <button 
             onClick={() => setActiveTab('list')}
             className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
           >
             {t.gear}
           </button>
           <button 
             onClick={() => setActiveTab('stats')}
             className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'stats' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
           >
             {t.stats}
           </button>
           <button 
             onClick={() => setActiveTab('ai')}
             className={`flex-1 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'ai' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
           >
             {t.insights}
           </button>
        </div>

        {activeTab === 'list' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Participant Tabs */}
            <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
              {trip.participants.map(p => (
                <button
                  key={p.id}
                  onClick={() => setActiveParticipantId(p.id)}
                  className={`shrink-0 px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 ${
                    activeParticipantId === p.id 
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xl' 
                    : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                  }`}
                >
                  {p.ownerName}
                </button>
              ))}
              {!isViewOnly && (
                <button 
                  onClick={addParticipant}
                  className="shrink-0 px-6 py-3.5 rounded-2xl border-2 border-dashed border-slate-200 text-slate-300 hover:border-indigo-400 hover:text-indigo-500 transition-all flex items-center gap-2"
                >
                  <Plus size={16} /> <span className="text-[10px] font-black uppercase">{t.addParticipant}</span>
                </button>
              )}
            </div>

            {activeParticipant && (
              <div className="space-y-8 pb-10">
                <div className="flex justify-between items-center px-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                      <User size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black text-slate-900 leading-tight">{activeParticipant.ownerName}</h2>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{t.yourGear}</p>
                    </div>
                  </div>
                  {!isViewOnly && (
                    <button 
                      onClick={() => setShowAddModal(true)}
                      className="bg-indigo-600 text-white px-7 py-4 rounded-[1.5rem] text-xs font-black flex items-center gap-2 shadow-xl shadow-indigo-100 hover:bg-indigo-700 active:scale-95 transition-all uppercase tracking-widest"
                    >
                      <Plus size={18} /> {t.addItem}
                    </button>
                  )}
                </div>

                {activeParticipant.items.length === 0 ? (
                  <div className="bg-white rounded-[3rem] p-16 text-center border-2 border-dashed border-slate-100">
                    <Package className="text-slate-100 w-24 h-24 mx-auto mb-6" />
                    <h3 className="text-slate-900 font-black mb-2 text-xl">{t.emptyPack}</h3>
                    <p className="text-slate-500 text-sm mb-10 font-medium px-10 leading-relaxed">{t.startAdding}</p>
                    {!isViewOnly && (
                      <button onClick={() => setShowAddModal(true)} className="bg-slate-50 text-indigo-600 px-8 py-4 rounded-[1.5rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-50 transition-all">
                        {t.firstItem}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-10">
                    {Object.entries(getGroupedItems(activeParticipant.items)).map(([cat, catItems]) => (
                      <div key={cat} className="space-y-4">
                        <div className="flex items-center gap-4 px-2">
                           <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white shadow-md ${getCategoryColor(cat as Category)}`}>
                              {getCategoryIcon(cat as Category)}
                           </div>
                           <h3 className="text-[11px] font-black text-slate-900 uppercase tracking-[0.15em]">
                             {t.categories[cat as Category]}
                           </h3>
                           <div className="flex-1 border-b border-slate-100"></div>
                        </div>
                        <div className="space-y-3">
                          {catItems.map(item => (
                            <div key={item.id} className={`bg-white rounded-[2rem] p-6 shadow-sm border border-slate-50 flex items-center gap-5 transition-all hover:shadow-md ${item.isWorn ? 'bg-amber-50/10' : ''}`}>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-3 mb-2">
                                  <h4 className="font-black text-slate-800 truncate text-base">{item.name}</h4>
                                  <div className="flex gap-1.5">
                                    {item.isWorn && <span className="text-[8px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-lg font-black uppercase">{t.worn}</span>}
                                    {item.isConsumable && <Utensils size={12} className="text-emerald-500" />}
                                  </div>
                                </div>
                                <div className="flex items-center gap-5">
                                   <div className="flex items-center gap-1.5 text-indigo-600 font-black text-[11px] uppercase">
                                     <Scale size={14} className="opacity-50" />
                                     {(item.weight * item.quantity / 1000).toFixed(2)}kg
                                   </div>
                                   <div className="text-slate-300 font-bold text-[10px] uppercase">
                                     {item.quantity}x {item.weight}g
                                   </div>
                                   {item.price > 0 && <div className="text-emerald-500 font-black text-[11px]">€{item.price * item.quantity}</div>}
                                </div>
                              </div>
                              {!isViewOnly && (
                                <div className="flex gap-2">
                                   <button 
                                     onClick={() => toggleStatus(item.id, 'isWorn')} 
                                     className={`p-3.5 rounded-2xl border-2 transition-all ${item.isWorn ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border-slate-100 text-slate-300 hover:border-indigo-100 hover:text-indigo-400'}`}
                                   >
                                     <Tag size={18} />
                                   </button>
                                   <button onClick={() => removeItem(item.id)} className="p-3.5 text-rose-400 hover:bg-rose-50 rounded-2xl transition-all border-2 border-transparent">
                                     <Trash2 size={18} />
                                   </button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && totalGroupStats && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.groupStats}</h2>
            
            <div className="grid grid-cols-2 gap-5">
               <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-2xl shadow-slate-200">
                  <p className="text-[9px] font-black uppercase opacity-50 mb-2 tracking-[0.2em]">{t.totalWeight}</p>
                  <p className="text-4xl font-black">{(totalGroupStats.totalWeight / 1000).toFixed(1)} <span className="text-base font-normal opacity-40">kg</span></p>
               </div>
               <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                  <p className="text-[9px] font-black uppercase text-slate-400 mb-2 tracking-[0.2em]">{t.totalCost}</p>
                  <p className="text-4xl font-black text-emerald-600 leading-tight">€{totalGroupStats.totalPrice.toLocaleString()}</p>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
              <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                <Users size={20} className="text-indigo-600" />
                {t.perPerson}
              </h3>
              <div className="space-y-5">
                {groupStats?.map(ps => (
                  <div key={ps.participant.id} className="flex items-center gap-5 bg-[#fcfdfe] p-5 rounded-[1.8rem] border border-slate-50">
                    <div className="w-14 h-14 bg-white rounded-2xl shadow-sm flex items-center justify-center font-black text-indigo-600 border border-slate-50 text-xl">
                      {ps.participant.ownerName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-black text-slate-800">{ps.participant.ownerName}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{(ps.stats.totalWeight / 1000).toFixed(2)} kg carried</p>
                    </div>
                    <div className="text-right">
                       <p className="text-lg font-black text-slate-900 leading-none">{(ps.stats.baseWeight / 1000).toFixed(2)}</p>
                       <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest mt-1">BASE KG</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {activeParticipant && (
              <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
                <h3 className="font-black text-slate-900 mb-8 flex items-center gap-3 text-xs uppercase tracking-[0.2em]">
                  <PieChart size={20} className="text-indigo-600" />
                  {activeParticipant.ownerName}'s {t.category}
                </h3>
                <WeightChart items={activeParticipant.items} />
              </div>
            )}
          </div>
        )}

        {activeTab === 'ai' && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex items-center gap-3 mb-4 px-2">
              <Sparkles className="text-amber-500" size={28} />
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">{t.aiTitle}</h2>
            </div>
            {activeParticipant && <AIInsights items={activeParticipant.items} stats={calculatePackStats(activeParticipant.items)} language={language} />}
          </div>
        )}
      </main>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-center justify-center p-6">
          <div className="bg-white w-full max-w-sm rounded-[3.5rem] p-10 shadow-[0_30px_60px_-12px_rgba(0,0,0,0.3)] animate-in fade-in zoom-in duration-500">
            <div className="text-center mb-10">
              <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.8rem] flex items-center justify-center mx-auto mb-8 transform rotate-3">
                <Share2 size={44} strokeWidth={2.5} />
              </div>
              <h2 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">{t.share}</h2>
              <div className="bg-amber-50 p-4 rounded-2xl mb-4 border border-amber-100 flex gap-3 text-left">
                 <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                 <p className="text-xs text-amber-800 font-medium leading-relaxed">
                   <strong>Important:</strong> This link is a snapshot. If you or your friends add items, you must generate and share a <strong>NEW</strong> link to see the updates.
                 </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-[1.8rem] p-6 flex items-center gap-4 border border-slate-100 mb-10">
              <input 
                readOnly 
                value={generateShareLink().substring(0, 30) + '...'} 
                className="bg-transparent text-xs font-mono text-slate-400 flex-1 outline-none"
              />
              <button 
                onClick={copyToClipboard}
                className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100 text-indigo-600 active:scale-90 transition-all hover:border-indigo-100"
              >
                {copySuccess ? <Check size={22} /> : <Copy size={22} />}
              </button>
            </div>

            <button 
              onClick={() => setShowShareModal(false)}
              className="w-full bg-slate-900 text-white font-black py-6 rounded-[1.8rem] shadow-2xl hover:bg-slate-800 transition-all uppercase text-xs tracking-widest"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <AddItemModal 
          onClose={() => setShowAddModal(false)}
          onAdd={addItem}
          language={language}
        />
      )}
    </div>
  );
};

const AddItemModal: React.FC<{ onClose: () => void, onAdd: (item: Omit<GearItem, 'id'>) => void, language: Language }> = ({ onClose, onAdd, language }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.MISC);
  const [weight, setWeight] = useState('');
  const [quantity, setQuantity] = useState('1');
  const [price, setPrice] = useState('');
  const [isWorn, setIsWorn] = useState(false);
  const [isConsumable, setIsConsumable] = useState(false);
  const t = translations[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !weight) return;
    onAdd({
      name,
      category,
      weight: parseFloat(weight),
      price: parseFloat(price) || 0,
      quantity: parseInt(quantity) || 1,
      isWorn,
      isConsumable
    });
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-xl z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
      <div className="bg-white w-full max-w-lg rounded-t-[3.5rem] sm:rounded-[3.5rem] p-10 shadow-2xl animate-in slide-in-from-bottom duration-500 max-h-[92vh] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center mb-10">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">{t.addItem}</h2>
          <button onClick={onClose} className="bg-slate-50 p-4 rounded-full text-slate-300 hover:text-rose-500 hover:bg-rose-50 transition-all">
            <Plus size={28} className="rotate-45" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.name}</label>
            <input 
              required
              autoFocus
              className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-5 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none transition-all font-black text-slate-800 placeholder:text-slate-200"
              placeholder="e.g. Featherweight Tent"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.category}</label>
              <select 
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-5 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none appearance-none font-black text-slate-800"
                value={category}
                onChange={e => setCategory(e.target.value as Category)}
              >
                {(Object.values(Category) as Category[]).map(cat => (
                  <option key={cat} value={cat}>{t.categories[cat]}</option>
                ))}
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.weight} (g)</label>
              <div className="relative">
                <input 
                  type="number"
                  required
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-5 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none font-black text-slate-800 pr-14"
                  placeholder="200"
                  value={weight}
                  onChange={e => setWeight(e.target.value)}
                />
                <Weight className="absolute right-7 top-6 text-slate-200" size={20} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.quantity}</label>
              <input 
                type="number"
                className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-5 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none font-black text-slate-800"
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em] ml-2">{t.price} (€)</label>
              <div className="relative">
                <input 
                  type="number"
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] px-7 py-5 focus:ring-8 focus:ring-indigo-50/50 focus:border-indigo-500 outline-none font-black text-slate-800 pr-14"
                  placeholder="0"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                />
                <Euro className="absolute right-7 top-6 text-slate-200" size={20} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <label className="flex items-center gap-4 cursor-pointer select-none p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] hover:bg-indigo-50/30 transition-all group">
              <input 
                type="checkbox"
                className="w-7 h-7 rounded-xl border-slate-200 text-indigo-600 focus:ring-indigo-500 transition-all"
                checked={isWorn}
                onChange={e => setIsWorn(e.target.checked)}
              />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-indigo-600 transition-all">{t.worn}</span>
            </label>
            <label className="flex items-center gap-4 cursor-pointer select-none p-6 bg-slate-50 border-2 border-slate-50 rounded-[1.8rem] hover:bg-emerald-50/30 transition-all group">
              <input 
                type="checkbox"
                className="w-7 h-7 rounded-xl border-slate-200 text-emerald-600 focus:ring-emerald-500 transition-all"
                checked={isConsumable}
                onChange={e => setIsConsumable(e.target.checked)}
              />
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] group-hover:text-emerald-600 transition-all">{t.isConsumable}</span>
            </label>
          </div>

          <button 
            type="submit"
            className="w-full bg-slate-900 text-white font-black py-7 rounded-[2rem] shadow-2xl shadow-slate-200 hover:bg-slate-800 active:scale-[0.98] transition-all tracking-[0.3em] text-[11px] uppercase"
          >
            {t.saveItem}
          </button>
        </form>
      </div>
    </div>
  );
};

const getCategoryIcon = (cat: Category) => {
  switch (cat) {
    case Category.SHELTER: return <Tent size={18} />;
    case Category.SLEEP: return <Moon size={18} />;
    case Category.CLOTHING: return <Shirt size={18} />;
    case Category.COOKING: return <Flame size={18} />;
    case Category.ELECTRONICS: return <Smartphone size={18} />;
    case Category.HYGIENE: return <Droplets size={18} />;
    case Category.FOOD: return <Apple size={18} />;
    case Category.MISC: return <Package size={18} />;
    default: return <Package size={18} />;
  }
};

const getCategoryColor = (cat: Category) => {
  switch (cat) {
    case Category.SHELTER: return 'bg-indigo-500';
    case Category.SLEEP: return 'bg-sky-500';
    case Category.CLOTHING: return 'bg-emerald-500';
    case Category.COOKING: return 'bg-amber-500';
    case Category.ELECTRONICS: return 'bg-rose-500';
    case Category.HYGIENE: return 'bg-teal-500';
    case Category.FOOD: return 'bg-emerald-400';
    case Category.MISC: return 'bg-slate-500';
    default: return 'bg-indigo-500';
  }
};

export default App;
