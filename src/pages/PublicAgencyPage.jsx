import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Car, MapPin, Phone, Mail, Globe, Clock,
  Star, ArrowRight, Share2, Check, ChevronRight,
  Instagram, MessageCircle, X
} from 'lucide-react';

const GOLD = "#D4AF37";

const DAYS_FR = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

// ── Card véhicule ────────────────────────────────────────────────────────────
const VehicleCard = ({ vehicle, onBook }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4 }}
    className="bg-zinc-900/50 border border-white/5 rounded-[2rem] overflow-hidden group hover:border-[#D4AF37]/30 transition-all cursor-pointer"
    onClick={() => onBook && onBook(vehicle)}
  >
    <div className="relative h-48 bg-zinc-900 overflow-hidden">
      {vehicle.image
        ? <img src={vehicle.image} alt={vehicle.model} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
        : <div className="w-full h-full flex items-center justify-center"><Car size={40} className="text-zinc-700" /></div>
      }
      {vehicle.status === 'available' && (
        <div className="absolute top-3 right-3 bg-emerald-500/90 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full backdrop-blur-sm">
          Disponible
        </div>
      )}
      {vehicle.status === 'rented' && (
        <div className="absolute top-3 right-3 bg-red-500/90 text-white text-[9px] font-black uppercase px-3 py-1 rounded-full backdrop-blur-sm">
          En location
        </div>
      )}
    </div>
    <div className="p-6">
      <h3 className="text-lg font-black uppercase tracking-tight mb-1">{vehicle.model}</h3>
      {vehicle.brand && <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-3">{vehicle.brand}</p>}
      <div className="flex items-center justify-between">
        <div>
          <span className="text-2xl font-black" style={{ color: GOLD }}>{vehicle.price_per_day || vehicle.price || '—'}</span>
          {(vehicle.price_per_day || vehicle.price) && <span className="text-zinc-500 text-xs font-bold"> €/jour</span>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center group-hover:bg-[#D4AF37] transition-all">
          <ChevronRight size={16} style={{ color: GOLD }} className="group-hover:text-black" />
        </div>
      </div>
    </div>
  </motion.div>
);

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function PublicAgencyPage({ storeCode, onEnterStore, onBack }) {
  const [agency, setAgency] = useState(null);
  const [profile, setProfile] = useState(null);
  const [fleet, setFleet] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('fleet');

  useEffect(() => { if (storeCode) loadAgency(); }, [storeCode]);

  const loadAgency = async () => {
    try {
      setIsLoading(true);

      // Charger les infos de l'agence depuis store_settings
      const { data: storeData } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_code', storeCode.toUpperCase())
        .maybeSingle();

      if (!storeData) { setNotFound(true); return; }
      setAgency(storeData);

      // Charger le profil agence (agency_profiles)
      const { data: profileData } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', storeData.user_id)
        .maybeSingle();
      if (profileData) setProfile(profileData);

      // Charger la flotte
      const { data: fleetData } = await supabase
        .from('fleet')
        .select('*')
        .eq('user_id', storeData.user_id)
        .neq('status', 'maintenance')
        .order('created_at', { ascending: false });
      setFleet(fleetData || []);

    } catch (err) {
      console.error(err);
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/agence/${storeCode}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const agencyName = profile?.agency_name || agency?.shop_name || 'Agence Shift';
  const city = profile?.city || agency?.city;
  const phone = profile?.phone || agency?.concierge_phone;
  const email = profile?.email;
  const website = profile?.website;
  const description = profile?.description;
  const tagline = profile?.tagline;
  const hours = profile?.hours;
  const coverUrl = profile?.cover_url;
  const logoUrl = profile?.logo_url;

  // ── Loading ──
  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-500">Chargement...</p>
      </div>
    </div>
  );

  // ── Not found ──
  if (notFound) return (
    <div className="min-h-screen bg-black flex items-center justify-center text-white">
      <div className="text-center px-6">
        <div className="w-16 h-16 bg-zinc-900 border border-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Car size={28} className="text-zinc-600" />
        </div>
        <h2 className="text-3xl font-black uppercase tracking-tighter mb-3">Agence introuvable</h2>
        <p className="text-zinc-500 text-sm mb-8">Le code <span className="text-white font-black">{storeCode}</span> ne correspond à aucune agence.</p>
        <button onClick={onBack}
          className="px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  const availableCount = fleet.filter(v => v.status === 'available').length;
  const tabs = [
    { id: 'fleet', label: `Flotte (${fleet.length})` },
    { id: 'infos', label: 'Infos & Horaires' },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* ── Cover + Header ── */}
      <div className="relative h-64 md:h-80 overflow-hidden">
        {coverUrl
          ? <img src={coverUrl} alt="cover" className="w-full h-full object-cover" />
          : <div className="w-full h-full bg-gradient-to-br from-zinc-900 via-zinc-950 to-black" />
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

        {/* Bouton retour */}
        <button onClick={onBack}
          className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 bg-black/70 border border-white/10 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest hover:border-white/30 transition-all">
          <X size={13} /> Retour
        </button>

        {/* Bouton partager */}
        <button onClick={handleShare}
          className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2.5 bg-black/70 border border-white/10 rounded-xl backdrop-blur-md text-[10px] font-black uppercase tracking-widest hover:border-[#D4AF37]/40 transition-all">
          {copied ? <Check size={13} className="text-emerald-400" /> : <Share2 size={13} />}
          {copied ? 'Lien copié !' : 'Partager'}
        </button>

        {/* Infos agence en bas de la cover */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 flex items-end gap-5">
          {logoUrl && (
            <div className="w-16 h-16 rounded-2xl border-2 border-[#D4AF37]/50 overflow-hidden bg-black flex-shrink-0">
              <img src={logoUrl} alt="logo" className="w-full h-full object-contain p-1" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter leading-none mb-1">{agencyName}</h1>
            {tagline && <p className="text-zinc-400 text-sm font-bold italic mb-2">"{tagline}"</p>}
            <div className="flex items-center gap-4 flex-wrap">
              {city && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-zinc-500 uppercase">
                  <MapPin size={11} style={{ color: GOLD }} /> {city}
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase px-3 py-1 rounded-full border" style={{ color: GOLD, borderColor: `${GOLD}40`, background: `${GOLD}15` }}>
                {storeCode}
              </span>
              {availableCount > 0 && (
                <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 uppercase">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {availableCount} véhicule{availableCount > 1 ? 's' : ''} disponible{availableCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── CTA Accéder au showroom ── */}
      <div className="px-6 md:px-10 py-6 border-b border-white/5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-zinc-950/50">
        <p className="text-zinc-400 text-sm">
          {description
            ? description.slice(0, 120) + (description.length > 120 ? '...' : '')
            : 'Découvrez notre sélection de véhicules de luxe disponibles à la location.'}
        </p>
        <button
          onClick={() => onEnterStore(agency)}
          className="flex-shrink-0 flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all shadow-[0_8px_24px_rgba(212,175,55,0.3)]"
        >
          <Car size={15} /> Accéder au showroom <ArrowRight size={14} />
        </button>
      </div>

      {/* ── Tabs ── */}
      <div className="px-6 md:px-10 pt-8">
        <div className="flex gap-1 bg-zinc-900/40 p-1.5 rounded-2xl border border-white/5 w-fit mb-8">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">

          {/* ── Flotte ── */}
          {activeTab === 'fleet' && (
            <motion.div key="fleet" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="pb-16">
              {fleet.length === 0 ? (
                <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[2.5rem]">
                  <Car size={36} className="mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500 font-bold uppercase text-sm">Flotte non disponible</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {fleet.map(v => (
                    <VehicleCard key={v.id} vehicle={v} onBook={() => onEnterStore(agency)} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── Infos & Horaires ── */}
          {activeTab === 'infos' && (
            <motion.div key="infos" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-16">

              {/* Contact */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-4">
                <h3 className="text-base font-black uppercase tracking-tighter mb-5">Contact</h3>
                {[
                  phone && { icon: Phone, label: 'Téléphone', value: phone, href: `tel:${phone}` },
                  email && { icon: Mail, label: 'Email', value: email, href: `mailto:${email}` },
                  website && { icon: Globe, label: 'Site web', value: website.replace('https://', ''), href: website },
                  (profile?.city || agency?.city) && { icon: MapPin, label: 'Adresse', value: [profile?.address, profile?.city, profile?.country].filter(Boolean).join(', ') || city },
                ].filter(Boolean).map(({ icon: Icon, label, value, href }) => (
                  <div key={label} className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center flex-shrink-0">
                      <Icon size={14} style={{ color: GOLD }} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">{label}</p>
                      {href
                        ? <a href={href} target="_blank" rel="noopener noreferrer" className="text-sm font-bold hover:text-[#D4AF37] transition-colors truncate block">{value}</a>
                        : <p className="text-sm font-bold truncate">{value}</p>
                      }
                    </div>
                  </div>
                ))}
                {!phone && !email && !website && !city && (
                  <p className="text-zinc-600 text-xs font-bold uppercase">Coordonnées non renseignées</p>
                )}
              </div>

              {/* Horaires */}
              <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8">
                <h3 className="text-base font-black uppercase tracking-tighter mb-5">Horaires d'ouverture</h3>
                {hours ? (
                  <div className="space-y-3">
                    {DAYS_FR.map(day => {
                      const dayInfo = hours[day];
                      const today = new Date().toLocaleDateString('fr-FR', { weekday: 'long' });
                      const isToday = today.charAt(0).toUpperCase() + today.slice(1) === day;
                      return (
                        <div key={day} className={`flex items-center justify-between py-2 ${isToday ? 'border-l-2 border-[#D4AF37] pl-3' : ''}`}>
                          <span className={`text-[11px] font-black uppercase tracking-wider ${isToday ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>
                            {day} {isToday && <span className="text-[9px] text-zinc-500">(aujourd'hui)</span>}
                          </span>
                          {dayInfo?.closed
                            ? <span className="text-[10px] font-bold text-zinc-600 uppercase">Fermé</span>
                            : <span className="text-[11px] font-black text-white">{dayInfo?.open} — {dayInfo?.close}</span>
                          }
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-zinc-600 text-xs font-bold uppercase">Horaires non renseignés</p>
                )}
              </div>

              {/* Description complète */}
              {description && description.length > 120 && (
                <div className="md:col-span-2 bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8">
                  <h3 className="text-base font-black uppercase tracking-tighter mb-4">À propos</h3>
                  <p className="text-zinc-400 leading-relaxed text-sm">{description}</p>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}

