import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, LogOut, Zap, Gauge, Search, Calendar, X, User, PhoneCall, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import BookingModal from '../../components/BookingModal';

const GOLD = "#D4AF37";

export default function Storefront({ onLogout }) {
  const { user } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [agencyProfile, setAgencyProfile] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('shift_selected_store');
    if (saved) {
      const store = JSON.parse(saved);
      setStoreSettings(store);
      loadFleet(store.user_id);
      loadAgencyProfile(store.user_id);
    } else {
      loadAllFleet();
    }
  }, []);

  const loadAgencyProfile = async (merchantId) => {
    try {
      const { data } = await supabase
        .from('agency_profiles')
        .select('logo_url, tagline, agency_name')
        .eq('user_id', merchantId)
        .maybeSingle();
      if (data) setAgencyProfile(data);
    } catch (err) { console.error(err); }
  };

  const loadFleet = async (merchantId) => {
    try {
      setIsLoading(true);
      const { data } = await supabase.from('fleet').select('*').eq('user_id', merchantId).eq('status', 'available').order('created_at', { ascending: false });
      setVehicles(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const loadAllFleet = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase.from('fleet').select('*').eq('status', 'available');
      setVehicles(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleLeaveStore = () => {
    localStorage.removeItem('shift_selected_store');
    localStorage.removeItem('shift_viewing_store');
    window.location.reload();
  };

  const filtered = vehicles.filter(v =>
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.fuel?.toLowerCase().includes(search.toLowerCase())
  );

  const shopName = agencyProfile?.agency_name || storeSettings?.shop_name || 'Shift Luxury';

  return (
    <div className="min-h-screen bg-black text-white pb-32">

      {/* Nav */}
      <nav className="h-20 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={handleLeaveStore} className="p-2 text-zinc-500 hover:text-white transition-colors mr-1">
            <ArrowLeft size={18} />
          </button>

          {/* Logo ou icône */}
          {agencyProfile?.logo_url ? (
            <div className="w-10 h-10 rounded-xl overflow-hidden bg-zinc-900 border border-white/10 flex-shrink-0">
              <img src={agencyProfile.logo_url} alt="logo" className="w-full h-full object-contain p-1" />
            </div>
          ) : (
            <div className="w-10 h-10 border-2 border-[#D4AF37] rounded-xl flex items-center justify-center flex-shrink-0">
              <Car size={16} style={{ color: GOLD }} />
            </div>
          )}

          {/* Nom agence */}
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase leading-tight">
              {shopName.split(' ').length > 1
                ? <>{shopName.split(' ')[0]} <span style={{ color: GOLD }}>{shopName.split(' ').slice(1).join(' ')}</span></>
                : <span style={{ color: GOLD }}>{shopName}</span>
              }
            </h1>
            {storeSettings?.store_code && (
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{storeSettings.store_code}</p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="hidden md:block text-[10px] font-bold text-zinc-500 uppercase truncate max-w-[150px]">{user?.email}</span>
          <button onClick={() => { localStorage.removeItem('shift_viewing_store'); window.location.reload(); }}
            className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-[#D4AF37] transition-all">
            <User size={16} />
          </button>
          <button onClick={onLogout} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto">
        <header className="mb-10">
          <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter mb-2">
            {shopName.split(' ').length > 1
              ? <>{shopName.split(' ')[0]} <span style={{ color: GOLD }}>{shopName.split(' ').slice(1).join(' ')}</span></>
              : <span style={{ color: GOLD }}>{shopName}</span>
            }
          </h2>
          {agencyProfile?.tagline && (
            <p className="text-zinc-400 text-xs font-bold italic mb-3">"{agencyProfile.tagline}"</p>
          )}
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mb-6">
            {filtered.length} véhicule{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
          </p>
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input type="text" placeholder="Rechercher un modèle..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all" />
            {search && <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white"><X size={14} /></button>}
          </div>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center py-32">
            <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Car size={48} className="mx-auto mb-6 text-zinc-800" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">
              {search ? 'Aucun véhicule ne correspond' : 'Aucun véhicule disponible'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((v) => (
              <motion.div key={v.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                whileHover={{ y: -6 }}
                className="group bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-500 cursor-pointer"
                onClick={() => setSelectedVehicle(v)}>
                <div className="aspect-[16/10] overflow-hidden relative bg-zinc-900">
                  {v.image
                    ? <img src={v.image} alt={v.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    : <div className="w-full h-full flex items-center justify-center"><Car size={48} className="text-zinc-700" /></div>}
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur rounded-xl border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD }}>{v.price?.toLocaleString('fr-FR')}€/j</span>
                  </div>
                  {v.weekend_price && v.weekend_price !== v.price && (
                    <div className="absolute bottom-4 left-4 px-3 py-1 bg-[#D4AF37]/90 rounded-xl">
                      <span className="text-[9px] font-black uppercase text-black">WE : {v.weekend_price?.toLocaleString('fr-FR')}€/j</span>
                    </div>
                  )}
                </div>
                <div className="p-7">
                  <div className="mb-4">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">{v.model}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{v.fuel} • {v.seats} places</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                      <Zap size={13} style={{ color: GOLD }} /><span className="text-[10px] font-bold uppercase">{v.hp} CV</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl">
                      <Gauge size={13} style={{ color: GOLD }} /><span className="text-[10px] font-bold uppercase">{v.speed} km/h</span>
                    </div>
                  </div>
                  {v.description && <p className="text-zinc-500 text-xs mb-5 line-clamp-2">{v.description}</p>}
                  <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs group-hover:bg-[#D4AF37] transition-colors flex items-center justify-center gap-2">
                    <Calendar size={14} /> Réserver
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {storeSettings?.concierge_phone && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
          <a href={`https://wa.me/${storeSettings.concierge_phone.replace(/\s/g, '')}`} target="_blank" rel="noreferrer"
            className="flex items-center gap-4 bg-zinc-900 border border-[#D4AF37]/30 p-4 rounded-2xl shadow-2xl hover:border-[#D4AF37] transition-all">
            <div className="w-10 h-10 bg-[#D4AF37] rounded-xl flex items-center justify-center flex-shrink-0">
              <PhoneCall size={18} className="text-black" />
            </div>
            <div>
              <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: GOLD }}>Conciergerie 24/7</p>
              <p className="text-white font-bold text-sm">{storeSettings.concierge_phone}</p>
            </div>
          </a>
        </div>
      )}

      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-zinc-900/90 backdrop-blur border border-white/10 px-8 py-4 rounded-[2.5rem] flex items-center gap-10 shadow-2xl z-50">
        <button className="flex flex-col items-center gap-1 text-[#D4AF37]">
          <Car size={20} /><span className="text-[8px] font-black uppercase">Showroom</span>
        </button>
        <button onClick={() => { localStorage.removeItem('shift_viewing_store'); window.location.reload(); }}
          className="flex flex-col items-center gap-1 text-zinc-500 hover:text-[#D4AF37] transition-colors">
          <User size={20} /><span className="text-[8px] font-black uppercase">Profil</span>
        </button>
        <button onClick={onLogout} className="flex flex-col items-center gap-1 text-zinc-500 hover:text-red-500 transition-colors">
          <LogOut size={20} /><span className="text-[8px] font-black uppercase">Quitter</span>
        </button>
      </nav>

      <AnimatePresence>
        {selectedVehicle && (
          <BookingModal vehicle={selectedVehicle} storeSettings={storeSettings} merchantId={storeSettings?.user_id} onClose={() => setSelectedVehicle(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

