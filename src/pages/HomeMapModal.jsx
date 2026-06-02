import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Car, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const GOLD = "#D4AF37";

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
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });
      setMapComponents({ ...reactLeaflet, goldIcon });
    }).catch(() => setMapComponents(null));
  }, []);

  if (!MapComponents) return (
    <div className="w-full h-full bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const { MapContainer, TileLayer, Marker, Popup, ZoomControl, goldIcon } = MapComponents;
  const validMerchants = merchants.filter(m => m.coords && Array.isArray(m.coords) && m.coords.length === 2);
  const center = validMerchants[0]?.coords || [46.603354, 1.888334];

  return (
    <MapContainer
      center={center}
      zoom={5}
      style={{ height: '100%', width: '100%', background: '#000', zIndex: 0 }}
      zoomControl={false}
      scrollWheelZoom={true}
      dragging={true}
    >
      <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" />
      <ZoomControl position="bottomright" />
      {validMerchants.map((m) => (
        <Marker key={m.id} position={m.coords} icon={goldIcon}>
          <Popup>
            <div style={{ background: '#111', color: '#fff', padding: '12px', borderRadius: '12px', minWidth: '180px', border: '1px solid rgba(212,175,55,0.3)' }}>
              <p style={{ color: GOLD, fontSize: '10px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: '6px' }}>{m.store_code}</p>
              <p style={{ fontSize: '14px', fontWeight: 700, marginBottom: '4px' }}>{m.shop_name || 'Agence Shift'}</p>
              {m.city && <p style={{ color: '#888', fontSize: '11px' }}>📍 {m.city}, {m.country || 'France'}</p>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function HomeMapModal({ isOpen, onClose }) {
  const [searchCode, setSearchCode] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(true);

  useEffect(() => {
    if (isOpen) fetchMerchants();
  }, [isOpen]);

  const fetchMerchants = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('*');
      if (data) setMerchants(data);
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setIsSearching(true); setSearchError(''); setSearchResult(null);
    try {
      const { data } = await supabase.from('store_settings').select('*').eq('store_code', searchCode.trim().toUpperCase()).maybeSingle();
      if (!data) setSearchError('Aucune boutique trouvée.');
      else setSearchResult(data);
    } catch { setSearchError('Erreur de recherche.'); }
    finally { setIsSearching(false); }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{ position: 'fixed', inset: 0, zIndex: 500 }}
        >
          {/* MAP — z-index 0, en dessous de tout */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
            <NightMap merchants={merchants} />
          </div>

          {/* UI — z-index 600, TOUJOURS au dessus de la map */}
          <div style={{ position: 'absolute', inset: 0, zIndex: 600, pointerEvents: 'none' }}>

            {/* Dégradé haut */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '120px',
              background: 'linear-gradient(to bottom, rgba(0,0,0,0.85), transparent)',
              pointerEvents: 'none'
            }} />

            {/* Dégradé bas */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '80px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
              pointerEvents: 'none'
            }} />

            {/* Barre du haut */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '20px 24px', pointerEvents: 'auto'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)' }}>
                  <Car size={16} color={GOLD} />
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 900, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'white' }}>
                    Shift <span style={{ color: GOLD }}>Luxury</span>
                  </div>
                  <div style={{ fontSize: '9px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.2em' }}>
                    {merchants.filter(m => m.coords).length} agences géolocalisées
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSearch(!showSearch)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: showSearch ? GOLD : 'rgba(0,0,0,0.7)',
                    border: `1px solid ${showSearch ? GOLD : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '12px', cursor: 'pointer', color: showSearch ? 'black' : 'white',
                    fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em',
                    backdropFilter: 'blur(10px)'
                  }}
                >
                  <Search size={13} /> Rechercher
                </button>
                <button
                  onClick={onClose}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    padding: '8px 16px', background: 'rgba(0,0,0,0.7)',
                    border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px',
                    cursor: 'pointer', color: 'white', fontSize: '10px', fontWeight: 900,
                    textTransform: 'uppercase', letterSpacing: '0.1em', backdropFilter: 'blur(10px)'
                  }}
                >
                  <X size={13} /> Fermer
                </button>
              </div>
            </div>

            {/* Panel recherche */}
            <AnimatePresence>
              {showSearch && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  style={{
                    position: 'absolute', top: '80px', right: '24px',
                    width: '320px', background: 'rgba(0,0,0,0.85)',
                    border: '1px solid rgba(255,255,255,0.1)', borderRadius: '20px',
                    padding: '20px', backdropFilter: 'blur(20px)',
                    pointerEvents: 'auto'
                  }}
                >
                  <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                    <input
                      type="text"
                      placeholder="Code boutique — Ex: SHIFT-K439S"
                      value={searchCode}
                      autoFocus
                      onChange={(e) => { setSearchCode(e.target.value.toUpperCase()); setSearchError(''); setSearchResult(null); }}
                      style={{
                        flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '12px', padding: '10px 14px', fontSize: '11px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', outline: 'none'
                      }}
                    />
                    <button type="submit" disabled={isSearching || !searchCode}
                      style={{
                        padding: '10px 16px', background: GOLD, border: 'none', borderRadius: '12px',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', opacity: (!searchCode || isSearching) ? 0.5 : 1
                      }}>
                      <ArrowRight size={16} color="black" />
                    </button>
                  </form>

                  {searchError && <p style={{ color: '#f87171', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginBottom: '8px' }}>{searchError}</p>}

                  {searchResult && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <p style={{ color: GOLD, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Trouvé !</p>
                      <p style={{ color: 'white', fontWeight: 900, fontSize: '14px' }}>{searchResult.shop_name || 'Agence Shift'}</p>
                      {searchResult.city && <p style={{ color: '#888', fontSize: '11px', marginBottom: '12px' }}>📍 {searchResult.city}</p>}
                      <button onClick={() => { setShowSearch(false); onClose(); }}
                        style={{
                          width: '100%', padding: '10px', background: GOLD, border: 'none', borderRadius: '12px',
                          cursor: 'pointer', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase',
                          letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
                        }}>
                        <Car size={14} /> Accéder au showroom
                      </button>
                    </div>
                  )}

                  {merchants.length > 0 && !searchResult && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '12px' }}>
                      <p style={{ color: '#666', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '8px' }}>Agences sur le réseau</p>
                      {merchants.slice(0, 4).map((m) => (
                        <button key={m.id}
                          onClick={() => { setSearchCode(m.store_code); setSearchResult(m); }}
                          style={{
                            width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                            padding: '8px 10px', background: 'rgba(255,255,255,0.04)', border: 'none',
                            borderRadius: '10px', cursor: 'pointer', marginBottom: '4px', textAlign: 'left'
                          }}>
                          <MapPin size={12} color={GOLD} />
                          <div>
                            <p style={{ color: 'white', fontSize: '11px', fontWeight: 900, textTransform: 'uppercase' }}>{m.shop_name || m.store_code}</p>
                            {m.city && <p style={{ color: '#666', fontSize: '9px' }}>{m.city}</p>}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Compteur bas gauche */}
            <div style={{
              position: 'absolute', bottom: '20px', left: '24px',
              display: 'flex', alignItems: 'center', gap: '8px',
              padding: '8px 14px', background: 'rgba(0,0,0,0.7)',
              border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px',
              backdropFilter: 'blur(10px)', pointerEvents: 'auto'
            }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', animation: 'pulse 2s infinite' }} />
              <span style={{ fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.15em', color: '#999' }}>
                {merchants.length} agence{merchants.length > 1 ? 's' : ''} active{merchants.length > 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
