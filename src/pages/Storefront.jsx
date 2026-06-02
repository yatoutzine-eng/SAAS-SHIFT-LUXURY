import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, LogOut, Fuel, Users, Zap, Gauge, Search, Calendar, X } from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';
import { supabase } from '../../lib/supabase';
import BookingModal from '../../components/BookingModal';

const GOLD = "#D4AF37";

export default function Storefront() {
  const { logout, user } = useAuthStore();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [storeSettings, setStoreSettings] = useState(null);
  const [storeCode, setStoreCode] = useState('');

  useEffect(() => {
    // Récupère le store_code depuis localStorage (mis par HomePage)
    const saved = localStorage.getItem('shift_selected_store');
    if (saved) {
      const store = JSON.parse(saved);
      setStoreSettings(store);
      setStoreCode(store.store_code);
      loadFleet(store.user_id);
    } else {
      loadAllFleet();
    }
  }, []);

  const loadFleet = async (merchantId) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('fleet')
        .select('*')
        .eq('user_id', merchantId)
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setVehicles(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const loadAllFleet = async () => {
    try {
      setIsLoading(true);
      const { data } = await supabase
        .from('fleet')
        .select('*')
        .eq('status', 'available')
        .order('created_at', { ascending: false });
      setVehicles(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const filtered = vehicles.filter(v =>
    v.model?.toLowerCase().includes(search.toLowerCase()) ||
    v.fuel?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Nav */}
      <nav className="h-20 border-b border-white/5 bg-black/80 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 border-2 border-[#D4AF37] rounded-xl flex items-center justify-center">
            <Car size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest uppercase">
              Shift <span style={{ color: GOLD }}>Luxury</span>
            </h1>
            {storeSettings?.shop_name && (
              <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">{storeSettings.shop_name}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <span className="hidden md:block text-[10px] font-bold text-zinc-500 uppercase">{user?.email}</span>
          <button onClick={logout} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </nav>

      <main className="p-6 lg:p-12 max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            {storeSettings?.shop_name || 'La Collection'} <span style={{ color: GOLD }}>Privée</span>
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs mb-8">
            {filtered.length} véhicule{filtered.length > 1 ? 's' : ''} disponible{filtered.length > 1 ? 's' : ''}
          </p>

          {/* Barre de recherche */}
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Rechercher un modèle..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all"
            />
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
            <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm">
              {search ? 'Aucun véhicule correspond à votre recherche' : 'Aucun véhicule disponible pour le moment'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filtered.map((v) => (
              <motion.div
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden relative bg-zinc-900">
                  {v.image
                    ? <img src={v.image} alt={v.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    : <div className="w-full h-full flex items-center justify-center"><Car size={48} className="text-zinc-700" /></div>
                  }
                  <div className="absolute top-4 right-4 px-3 py-1.5 bg-black/70 backdrop-blur rounded-xl border border-white/10">
                    <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD }}>
                      {v.price?.toLocaleString('fr-FR')}€ / jour
                    </span>
                  </div>
                  {v.weekend_price && v.weekend_price !== v.price && (
                    <div className="absolute bottom-4 left-4 px-3 py-1.5 bg-[#D4AF37]/90 backdrop-blur rounded-xl">
                      <span className="text-[9px] font-black uppercase tracking-widest text-black">
                        Weekend : {v.weekend_price?.toLocaleString('fr-FR')}€/j
                      </span>
                    </div>
                  )}
                </div>

                <div className="p-7">
                  <div className="mb-5">
                    <h3 className="text-xl font-black uppercase tracking-tight mb-1">{v.model}</h3>
                    <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{v.fuel} • {v.seats} Places</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <Zap size={14} style={{ color: GOLD }} />
                      <span className="text-[10px] font-bold uppercase">{v.hp} CV</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <Gauge size={14} style={{ color: GOLD }} />
                      <span className="text-[10px] font-bold uppercase">{v.speed} km/h</span>
                    </div>
                  </div>

                  {v.description && (
                    <p className="text-zinc-500 text-xs mb-5 line-clamp-2">{v.description}</p>
                  )}

                  <button
                    onClick={() => setSelectedVehicle(v)}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-colors flex items-center justify-center gap-2"
                  >
                    <Calendar size={14} /> Réserver ce véhicule
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de réservation */}
      <AnimatePresence>
        {selectedVehicle && (
          <BookingModal
            vehicle={selectedVehicle}
            storeSettings={storeSettings}
            merchantId={storeSettings?.user_id}
            onClose={() => setSelectedVehicle(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
