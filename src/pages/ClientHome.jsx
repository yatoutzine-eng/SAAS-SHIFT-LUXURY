import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapPin, Car, X, ArrowRight, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

function NightMap({ merchants }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let map = null;

    const initMap = async () => {
      try {
        const L = (await import('leaflet')).default;
        await import('leaflet/dist/leaflet.css');

        if (!mapRef.current || mapInstanceRef.current) return;

        // Créer la map Leaflet directement (sans react-leaflet pour éviter les z-index)
        map = L.map(mapRef.current, {
          center: [46.603354, 1.888334],
          zoom: 5,
          zoomControl: true,
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
          attribution: '&copy; CARTO'
        }).addTo(map);

        const goldIcon = L.divIcon({
          html: `<div style="width:18px;height:18px;background:#D4AF37;border-radius:50%;border:3px solid white;box-shadow:0 0 10px rgba(212,175,55,0.6);"></div>`,
          className: '',
          iconSize: [18, 18],
          iconAnchor: [9, 9],
          popupAnchor: [0, -12]
        });

        // Ajouter les marqueurs
        const validMerchants = merchants.filter(m => {
          if (!m.coords) return false;
          // Gérer les deux formats : tableau [lat,lng] ou objet {lat,lng}
          if (Array.isArray(m.coords) && m.coords.length === 2) return true;
          if (typeof m.coords === 'object' && m.coords.lat && m.coords.lng) return true;
          return false;
        });

        validMerchants.forEach(m => {
          const pos = Array.isArray(m.coords) ? m.coords : [m.coords.lat, m.coords.lng];
          L.marker(pos, { icon: goldIcon })
            .addTo(map)
            .bindPopup(`
              <div style="background:#111;color:#fff;padding:12px;border-radius:12px;min-width:160px;border:1px solid rgba(212,175,55,0.3)">
                <p style="color:#D4AF37;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.15em;margin-bottom:4px">${m.store_code || ''}</p>
                <p style="font-size:13px;font-weight:700">${m.shop_name || 'Agence Shift'}</p>
                ${m.city ? `<p style="color:#888;font-size:10px;margin-top:2px">📍 ${m.city}</p>` : ''}
              </div>
            `);
        });

        if (validMerchants.length > 0) {
          const pos = Array.isArray(validMerchants[0].coords)
            ? validMerchants[0].coords
            : [validMerchants[0].coords.lat, validMerchants[0].coords.lng];
          map.setView(pos, 6);
        }

        mapInstanceRef.current = map;
        setIsReady(true);
      } catch (err) {
        console.error('Map error:', err);
      }
    };

    initMap();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [merchants]);

  return (
    <div className="relative w-full h-full">
      {!isReady && (
        <div className="absolute inset-0 bg-zinc-950 flex items-center justify-center z-10">
          <div className="w-6 h-6 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <div ref={mapRef} style={{ width: '100%', height: '100%', background: '#000' }} />
    </div>
  );
}

export default function ClientHome({ onEnterStore, onGoToAccount }) {
  const { logout, user } = useAuthStore();
  const [searchCode, setSearchCode] = useState('');
  const [merchants, setMerchants] = useState([]);
  const [searchResult, setSearchResult] = useState(null);
  const [searchError, setSearchError] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => { fetchMerchants(); }, []);

  const fetchMerchants = async () => {
    try {
      const { data } = await supabase.from('store_settings').select('*');
      if (data) {
        console.log('Marchands chargés:', data);
        setMerchants(data);
      }
    } catch (err) { console.error(err); }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchCode.trim()) return;
    setIsSearching(true); setSearchError(''); setSearchResult(null);
    try {
      const { data } = await supabase.from('store_settings').select('*')
        .eq('store_code', searchCode.trim().toUpperCase()).maybeSingle();
      if (!data) setSearchError('Aucune boutique trouvée avec ce code.');
      else setSearchResult(data);
    } catch { setSearchError('Erreur de recherche.'); }
    finally { setIsSearching(false); }
  };

  const validMerchantsCount = merchants.filter(m => m.coords).length;

  return (
    <div className="min-h-screen bg-black text-white" style={{ position: 'relative', overflow: 'hidden' }}>

      {/* MAP — z-index 0, plein écran, totalement interactive */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <NightMap merchants={merchants} />
      </div>

      {/* Overlay dégradé — pointer-events: none pour laisser la map cliquable */}
      <div style={{
        position: 'absolute', inset: 0, zIndex: 1, pointerEvents: 'none',
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.15) 35%, rgba(0,0,0,0.15) 65%, rgba(0,0,0,0.8) 100%)'
      }} />

      {/* UI — z-index 10, pointer-events: auto seulement sur les éléments UI */}
      <div style={{ position: 'absolute', inset: 0, zIndex: 10, pointerEvents: 'none' }}>

        {/* Header */}
        <div style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', border: '1px solid rgba(212,175,55,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }}>
              <Car size={16} color={GOLD} />
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 900, letterSpacing: '0.25em', textTransform: 'uppercase', color: 'white' }}>
                Shift <span style={{ color: GOLD }}>Luxury</span>
              </div>
              <div style={{ fontSize: '8px', color: '#888', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
                {user?.email}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={onGoToAccount} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer', color: 'white', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', backdropFilter: 'blur(10px)' }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              Mon compte
            </button>
            <button onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', cursor: 'pointer', color: '#999', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
              <LogOut size={13} /> Déco
            </button>
          </div>
        </div>

        {/* Centre — recherche */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 24px', marginTop: '60px', pointerEvents: 'auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ width: '100%', maxWidth: '480px', textAlign: 'center' }}>
            <p style={{ fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.3em', color: GOLD, marginBottom: '10px' }}>
              {validMerchantsCount} agence{validMerchantsCount > 1 ? 's' : ''} géolocalisée{validMerchantsCount > 1 ? 's' : ''}
            </p>
            <h2 style={{ fontSize: 'clamp(32px, 6vw, 52px)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '-0.03em', color: 'white', lineHeight: 1.1, marginBottom: '8px' }}>
              Trouvez votre<br /><span style={{ color: GOLD }}>agence</span>
            </h2>
            <p style={{ color: '#888', fontSize: '13px', marginBottom: '24px' }}>Entrez le code unique de votre agence</p>

            <form onSubmit={handleSearch}>
              <div style={{ display: 'flex', gap: '10px' }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <Search size={16} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input type="text" placeholder="Ex: SHIFT-K439S" value={searchCode}
                    onChange={(e) => { setSearchCode(e.target.value.toUpperCase()); setSearchError(''); setSearchResult(null); }}
                    style={{ width: '100%', background: 'rgba(0,0,0,0.75)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '16px', padding: '14px 14px 14px 44px', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'white', outline: 'none', backdropFilter: 'blur(20px)', boxSizing: 'border-box' }}
                  />
                  {searchCode && (
                    <button type="button" onClick={() => { setSearchCode(''); setSearchResult(null); setSearchError(''); }}
                      style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#666', cursor: 'pointer' }}>
                      <X size={14} />
                    </button>
                  )}
                </div>
                <button type="submit" disabled={isSearching || !searchCode}
                  style={{ padding: '14px 20px', background: GOLD, border: 'none', borderRadius: '16px', cursor: 'pointer', opacity: (!searchCode || isSearching) ? 0.5 : 1 }}>
                  {isSearching
                    ? <div style={{ width: '16px', height: '16px', border: '2px solid black', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                    : <ArrowRight size={18} color="black" />}
                </button>
              </div>
            </form>

            {searchError && (
              <p style={{ color: '#f87171', fontSize: '10px', fontWeight: 900, textTransform: 'uppercase', marginTop: '10px' }}>{searchError}</p>
            )}

            <AnimatePresence>
              {searchResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  style={{ marginTop: '16px', background: 'rgba(0,0,0,0.85)', border: '1px solid rgba(212,175,55,0.3)', borderRadius: '20px', padding: '20px', textAlign: 'left', backdropFilter: 'blur(20px)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <p style={{ color: GOLD, fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.2em', marginBottom: '4px' }}>Boutique trouvée ✓</p>
                      <p style={{ color: 'white', fontWeight: 900, fontSize: '18px', textTransform: 'uppercase', letterSpacing: '-0.02em' }}>{searchResult.shop_name || 'Agence Shift'}</p>
                      {searchResult.city && <p style={{ color: '#888', fontSize: '10px', marginTop: '2px' }}>📍 {searchResult.city}</p>}
                    </div>
                    <MapPin size={22} color={GOLD} />
                  </div>
                  <button onClick={() => onEnterStore(searchResult)}
                    style={{ width: '100%', padding: '12px', background: GOLD, border: 'none', borderRadius: '12px', cursor: 'pointer', fontWeight: 900, fontSize: '10px', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                    <Car size={14} /> Accéder au showroom
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Footer — agences rapides */}
        {merchants.length > 0 && (
          <div style={{ padding: '16px 24px', display: 'flex', justifyContent: 'center', gap: '10px', flexWrap: 'wrap', pointerEvents: 'auto' }}>
            {merchants.slice(0, 3).map(m => (
              <button key={m.id} onClick={() => { setSearchCode(m.store_code); setSearchResult(m); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '10px', cursor: 'pointer', color: '#999', fontSize: '9px', fontWeight: 900, textTransform: 'uppercase', backdropFilter: 'blur(10px)' }}>
                <MapPin size={10} color={GOLD} />
                {m.shop_name || m.store_code}
              </button>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .leaflet-container { background: #000 !important; }
        .leaflet-popup-content-wrapper { background: #111 !important; color: white !important; border-radius: 12px !important; border: 1px solid rgba(212,175,55,0.3) !important; }
        .leaflet-popup-tip { background: #111 !important; }
        .leaflet-control-zoom { border: 1px solid rgba(255,255,255,0.1) !important; }
        .leaflet-control-zoom a { background: rgba(0,0,0,0.8) !important; color: white !important; }
      `}</style>
    </div>
  );
}
