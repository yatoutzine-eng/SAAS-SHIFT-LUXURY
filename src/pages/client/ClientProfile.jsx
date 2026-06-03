import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, FileText, Car, Calendar, 
  ShieldCheck, ChevronRight, Upload, 
  Settings, Trophy, Share2, Crown,
  Mail, Phone, MapPin, Lock, Bell,
  CheckCircle2, AlertCircle, Moon, Sun,
  Save, Loader2, FileCheck, X, Globe
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import HolographicCard from '../../components/client/HolographicCard';
import ConciergeMenu from '../../components/client/ConciergeMenu';
import ThemeToggle from '../../components/ThemeToggle';
import Map from '../../components/Map';

const GOLD = "#D4AF37";

export default function ClientProfile() {
  const [activeSection, setActiveSection] = useState('garage');
  const [showMap, setShowMap] = useState(false);
  const { vehicles, reservations, profile, updateProfile, agencies } = useStore();
  
  const [formData, setFormData] = useState({ ...profile });
  const [isSaving, setIsSaving] = useState(false);

  const sections = [
    { id: 'garage', label: 'Mon Garage Élite', icon: Trophy },
    { id: 'reservations', label: 'Mes Réservations', icon: Calendar },
    { id: 'documents', label: 'Mes Documents', icon: FileText },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    updateProfile(formData);
    setIsSaving(false);
  };

  return (
    <div className="max-w-7xl mx-auto py-12 px-6 relative">
      {/* MODAL MAP INTERACTIVE */}
      <AnimatePresence>
        {showMap && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl p-8 flex flex-col"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tighter text-white">Réseau <span className="text-[#D4AF37]">Mondial</span></h2>
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Trouvez votre prochaine destination de luxe</p>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="w-14 h-14 bg-white/5 border border-white/10 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"
              >
                <X size={24} className="text-white" />
              </button>
            </div>
            
            <div className="flex-1 rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl relative">
              <Map 
                theme="dark" 
                agencies={agencies} 
                onAgencySelect={(a) => console.log("Selected:", a)} 
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="flex flex-col md:flex-row items-center gap-8 mb-16 theme-card p-10 rounded-[3rem] relative overflow-hidden border border-white/5">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <Crown size={120} style={{ color: GOLD }} />
        </div>

        <div className="relative">
          <div className="w-32 h-32 bg-gradient-to-tr from-zinc-800 to-zinc-900 border-2 border-[#D4AF37]/30 rounded-full flex items-center justify-center overflow-hidden shadow-2xl">
            <User size={48} style={{ color: GOLD }} />
          </div>
        </div>
        
        <div className="text-center md:text-left flex-1 z-10">
          <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 theme-text">
            {profile.firstName} <span style={{ color: GOLD }}>{profile.lastName}</span>
          </h1>
          <div className="flex flex-wrap justify-center md:justify-start gap-4">
            <span className="px-4 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-full text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">
              Black Member
            </span>
            {/* BOUTON TROUVER UNE AGENCE (RÉINSTALLÉ) */}
            <button 
              onClick={() => setShowMap(true)}
              className="px-4 py-1 bg-white/5 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest theme-text hover:bg-[#D4AF37] hover:text-black transition-all flex items-center gap-2"
            >
              <Globe size={12} /> Trouver une agence
            </button>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        <aside className="lg:col-span-1 space-y-2">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl transition-all group ${
                  activeSection === section.id 
                  ? 'bg-[#D4AF37] text-black shadow-[0_10px_30px_rgba(212,175,55,0.2)]' 
                  : 'theme-card theme-text-muted hover:text-[#D4AF37] border border-transparent hover:border-[#D4AF37]/20'
                }`}
              >
                <Icon size={20} />
                <span className="text-[10px] font-black uppercase tracking-widest">{section.label}</span>
                <ChevronRight size={14} className={`ml-auto transition-transform ${activeSection === section.id ? 'rotate-90' : ''}`} />
              </button>
            );
          })}
        </aside>

        <main className="lg:col-span-3">
          <AnimatePresence mode="wait">
            {activeSection === 'garage' && (
              <motion.div key="garage" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-12">
                <div className="flex justify-between items-end">
                  <div>
                    <h3 className="text-2xl font-black uppercase tracking-tight theme-text">Mon Garage <span style={{ color: GOLD }}>Élite</span></h3>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] theme-text-muted mt-2">Collection de trophées mécaniques</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                  {vehicles.slice(0, 3).map((v) => (
                    <HolographicCard key={v.id} vehicle={v} />
                  ))}
                </div>
              </motion.div>
            )}
            {/* Autres sections... */}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
