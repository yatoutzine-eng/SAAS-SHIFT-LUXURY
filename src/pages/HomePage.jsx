import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Car, Users, ArrowRight, X } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GOLD = "#D4AF37";

// Map en mode nuit via CartoDB Dark
function NightMap({ merchants }) {
  const [MapComponents, setMapComponents] = useState(null);

  useEffect(() => {
    Promise.all([
      import('react-leaflet'),
      import('leaflet'),
      import('leaflet/dist/leaflet.css')
    ]).then(([reactLeaflet, L]) => {
      const goldIcon = new L.default.Icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
      });
      setMapComponents({ ...reactLeaflet, goldIcon });
    }).catch(() => setMapComponents(null));
  }, []);

  if (!MapComponents) return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Chargement de la carte...</p>
      </div>
    </div>
  );

  const { MapContainer, TileLayer, Marker, Popup, ZoomControl, goldIcon } = MapComponents;
  const center = merchants[0]?.coords || [46.603354, 1.888334];

  return (
    <MapContainer
      center={center}
      zoom={6}
      style={{ height: '100%', width: '100%', background: '#000' }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        attribution='&copy; <a href="https://carto.com/">CARTO</a>'
      />
      <ZoomControl position="bottomright" />
      {merchants.map((m) => m.coords && (
        <Marker key={m.id} position={m.coords} icon={goldIcon}>
          <Popup>
            <div style={{ background: '#111', color: '#fff', padding: '12px', borderRadius: '12px', minWidth: '160px' }}>
              <p style={{ color: GOLD, fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '4px' }}>
                {m.store_code}
              </p>
              <p style={{ fontSize: '13px', fontWeight: 700 }}>{m.shop_name || 'Agence Shift'}</p>
              {m.address && (
                <p style={{ color: '#666', fontSize: '10px', marginTop: '4px' }}>{m.address}</p>
              )}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function HomePage({ onEnterStore, onGoToAuth }) {
  const [searchCode, setSearchCode] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchMerchants();
  }, []);

  const fetchMerchants = async () => {
    try {
      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .not('shop_name', 'is', null);
      if (data) setMerchants(data);
    } catch (err) {
      console.error('Erreur chargement marchands:', err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setIsSearching(true);
    setSearchError('');
    setSearchResult(null);

    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_code', searchCode.trim().toUpperCase())
        .maybeSingle();

      if (error || !data) {
        setSearchError('Aucune boutique trouvée avec ce code.');
      } else {
        setSearchResult(data);
      }
    } catch (err) {
      setSearchError('Erreur de recherche. Réessayez.');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">

      {/* MAP en fond plein écran */}
      <div className="absolute inset-0 z-0">
        <NightMap merchants={merchants} />
      </div>

      {/* Overlay dégradé */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/80 via-black/40 to-black/80 pointer-events-none" />

      {/* Contenu */}
      <div className="relative z-20 min-h-screen flex flex-col">

        {/* Header */}
        <header className="flex items-center justify-between p-6 md:p-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 border border-[#D4AF37]/40 rounded-full flex items-center justify-center">
              <Car size={18} style={{ color: GOLD }} />
            </div>
            <div>
              <h1 className="text-lg font-black uppercase tracking-[0.3em]">
                Shift <span style={{ color: GOLD }}>Luxury</span>
              </h1>
              <p className="text-[8px] text-zinc-500 font-black uppercase tracking-widest">Fleet Network</p>
            </div>
          </div>
          <button
            onClick={onGoToAuth}
            className="flex items-center gap-2 px-6 py-3 border border-[#D4AF37]/30 rounded-xl text-[10px] font-black uppercase tracking-widest text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-all"
          >
            Espace Marchand <ArrowRight size={12} />
          </button>
        </header>

        {/* Centre — Recherche */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xl text-center"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-[#D4AF37] mb-4">
              {merchants.length} agences actives sur le réseau
            </p>
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4 leading-none">
              Trouvez votre<br />
              <span style={{ color: GOLD }}>agence</span>
            </h2>
            <p className="text-zinc-400 text-sm mb-10">
              Entrez le code unique de votre agence de location
            </p>

            {/* Barre de recherche */}
            <form onSubmit={handleSearch} className="relative">
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="Ex: SHIFT-K439S"
                    value={searchCode}
                    onChange={(e) => {
                      setSearchCode(e.target.value.toUpperCase());
                      setSearchError('');
                      setSearchResult(null);
                    }}
                    className="w-full bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl py-5 pl-14 pr-5 text-sm font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37]/50 transition-all"
                  />
                  {searchCode && (
                    <button type="button" onClick={() => { setSearchCode(''); setSearchResult(null); setSearchError(''); }}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white">
                      <X size={16} />
                    </button>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isSearching || !searchCode}
                  className="px-8 py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight size={18} />
                  )}
                </button>
              </div>
            </form>

            {/* Erreur */}
            <AnimatePresence>
              {searchError && (
                <motion.p
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-4 text-red-400 text-[10px] font-black uppercase tracking-widest"
                >
                  {searchError}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Résultat trouvé */}
            <AnimatePresence>
              {searchResult && (
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="mt-6 bg-zinc-900/90 backdrop-blur-xl border border-[#D4AF37]/30 rounded-[2rem] p-8 text-left"
                >
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-1">
                        Boutique trouvée
                      </p>
                      <h3 className="text-2xl font-black uppercase tracking-tighter">
                        {searchResult.shop_name || 'Agence Shift'}
                      </h3>
                      <p className="text-zinc-500 text-[10px] font-bold mt-1">{searchResult.store_code}</p>
                    </div>
                    <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center border border-[#D4AF37]/20">
                      <MapPin size={20} style={{ color: GOLD }} />
                    </div>
                  </div>

                  <button
                    onClick={() => onEnterStore(searchResult)}
                    className="w-full py-4 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3"
                  >
                    <Car size={16} /> Accéder au showroom
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer — compteur agences */}
        <footer className="p-6 md:p-10 flex items-center justify-center gap-8">
          {merchants.slice(0, 3).map((m) => (
            <motion.button
              key={m.id}
              whileHover={{ scale: 1.05 }}
              onClick={() => { setSearchCode(m.store_code); setSearchResult(m); }}
              className="flex items-center gap-2 px-4 py-2 bg-zinc-900/60 backdrop-blur border border-white/5 rounded-xl text-[9px] font-black uppercase tracking-widest text-zinc-400 hover:text-[#D4AF37] hover:border-[#D4AF37]/20 transition-all"
            >
              <MapPin size={10} style={{ color: GOLD }} />
              {m.shop_name || m.store_code}
            </motion.button>
          ))}
        </footer>
      </div>
    </div>
  );
}
