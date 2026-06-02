import React from 'react';
import { MapPin, AlertCircle } from 'lucide-react';

// SAFE WRAPPER FOR LEAFLET
// Prevents the entire app from crashing if Leaflet is still installing/linking
export default function Map({ theme, onAgencySelect, agencies }) {
  try {
    // Dynamic check for Leaflet availability
    const { MapContainer, TileLayer, Marker, Popup, ZoomControl } = require('react-leaflet');
    const L = require('leaflet');
    import('leaflet/dist/leaflet.css');

    const goldIcon = new L.Icon({
      iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41]
    });

    const center = agencies[0]?.coords || [48.8566, 2.3522];
    const tileUrl = theme === 'dark' 
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

    return (
      <div className="h-full w-full relative z-0">
        <MapContainer 
          center={center} 
          zoom={13} 
          style={{ height: '100%', width: '100%', background: theme === 'dark' ? '#000' : '#f0f0f0' }}
          zoomControl={false}
        >
          <TileLayer url={tileUrl} />
          <ZoomControl position="topleft" />
          {agencies.map((agency) => (
            <Marker 
              key={agency.id} 
              position={agency.coords} 
              icon={goldIcon}
              eventHandlers={{ click: () => onAgencySelect(agency) }}
            >
              <Popup>
                <div className="p-2 bg-zinc-950 text-white rounded-lg">
                  <h3 className="font-black uppercase text-xs">{agency.name}</h3>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    );
  } catch (e) {
    // FALLBACK UI: Elegant placeholder if Leaflet fails to load
    return (
      <div className="h-full w-full bg-zinc-900/50 flex flex-col items-center justify-center border border-white/5 rounded-[2.5rem] overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="w-full h-full bg-[radial-gradient(#D4AF37_1px,transparent_1px)] [background-size:20px_20px]" />
        </div>
        <div className="relative z-10 text-center p-8">
          <div className="w-16 h-16 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[#D4AF37]/20">
            <MapPin className="text-[#D4AF37] animate-bounce" size={32} />
          </div>
          <h3 className="text-white font-black uppercase tracking-tighter mb-2">Initialisation de la Carte</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest max-w-[200px] mx-auto">
            Chargement des modules géographiques en cours...
          </p>
        </div>
      </div>
    );
  }
}
