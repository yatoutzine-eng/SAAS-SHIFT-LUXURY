import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, Zap, Gauge, Fuel, Users, 
  ShieldCheck, Calendar, Star, ArrowRight,
  CheckCircle2, Info, Loader2, AlertCircle
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { calculateDynamicPrice } from '../../utils/pricingEngine';
import { format, addDays } from 'date-fns';

const GOLD = "#D4AF37";

export default function VehicleDetail({ vehicleId, onBack, onBook, storeSettings }) {
  const { vehicles } = useStore();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState(null);

  // États pour la réservation
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    const found = vehicles.find(v => v.id === parseInt(vehicleId)) || 
                  JSON.parse(localStorage.getItem('SHIFT_FLEET_DATA'))?.find(v => v.id === parseInt(vehicleId));
    
    setTimeout(() => {
      setVehicle(found);
      setLoading(false);
    }, 400);
  }, [vehicleId, vehicles]);

  const handleBookingInitiation = () => {
    if (!startDate || !endDate) {
      setError("Veuillez sélectionner vos dates de location");
      setTimeout(() => setError(null), 3000);
      return;
    }

    if (new Date(startDate) >= new Date(endDate)) {
      setError("La date de fin doit être après la date de début");
      setTimeout(() => setError(null), 3000);
      return;
    }

    setIsChecking(true);
    
    // Simulation de vérification de disponibilité
    setTimeout(() => {
      setIsChecking(false);
      onBook(vehicle, startDate, endDate);
    }, 1200);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
        <Info size={48} className="text-zinc-700 mb-4" />
        <h2 className="text-2xl font-black uppercase tracking-tighter mb-2">Véhicule Introuvable</h2>
        <button onClick={onBack} className="px-8 py-4 bg-white text-black font-black text-[10px] uppercase tracking-widest rounded-2xl">
          Retour au catalogue
        </button>
      </div>
    );
  }

  // Calcul du prix dynamique pour l'affichage
  const pricing = calculateDynamicPrice(vehicle.price, storeSettings);

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="min-h-screen bg-black text-white pb-20"
    >
      {/* Hero Section */}
      <div className="relative h-[70vh] w-full overflow-hidden">
        <motion.img 
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1.5 }}
          src={vehicle.image} 
          className="w-full h-full object-cover"
          alt={vehicle.model}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />
        
        <div className="absolute top-0 left-0 right-0 p-8 flex justify-between items-center">
          <button 
            onClick={onBack}
            className="w-12 h-12 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full flex items-center justify-center hover:bg-[#D4AF37] hover:text-black transition-all"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="px-6 py-2 bg-black/40 backdrop-blur-xl border border-white/10 rounded-full">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Shift Exclusive</span>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4">
              {vehicle.model.split(' ')[0]} <br />
              <span className="text-[#D4AF37]">{vehicle.model.split(' ').slice(1).join(' ')}</span>
            </h1>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Star size={16} className="text-[#D4AF37] fill-[#D4AF37]" />
                <span className="text-sm font-bold">4.9 (24 Avis)</span>
              </div>
              <div className="h-1 w-1 bg-zinc-700 rounded-full" />
              <span className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Catégorie Prestige</span>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Zap, label: "Puissance", value: `${vehicle.hp} CV` },
              { icon: Gauge, label: "Vitesse Max", value: `${vehicle.speed} km/h` },
              { icon: Fuel, label: "Énergie", value: vehicle.fuel },
              { icon: Users, label: "Places", value: `${vehicle.seats} Sièges` }
            ].map((spec, i) => (
              <div key={i} className="bg-zinc-900/50 border border-white/5 p-6 rounded-[2rem]">
                <spec.icon size={20} className="text-[#D4AF37] mb-4" />
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">{spec.label}</p>
                <p className="text-lg font-bold">{spec.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-6">
            <h3 className="text-2xl font-black uppercase tracking-tighter">Expérience de <span className="text-[#D4AF37]">Conduite</span></h3>
            <p className="text-zinc-400 leading-relaxed text-lg">
              Dominez la route avec la {vehicle.model}. Ce chef-d'œuvre d'ingénierie combine une puissance brute de {vehicle.hp} chevaux avec un raffinement intérieur inégalé.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-8 bg-zinc-900 border border-[#D4AF37]/20 rounded-[3rem] p-8 shadow-2xl">
            <div className="flex justify-between items-end mb-8">
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-1">Tarif Journalier</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black text-[#D4AF37]">{pricing.finalPrice}€</span>
                  <span className="text-xs font-bold text-zinc-500 uppercase">/ jour</span>
                </div>
              </div>
              {pricing.isSurge && (
                <div className="px-3 py-1 bg-[#D4AF37] text-black rounded-full text-[8px] font-black uppercase tracking-widest">
                  Haute Demande
                </div>
              )}
            </div>

            <div className="space-y-4 mb-8">
              <div className={`bg-black/40 border rounded-2xl p-4 transition-colors ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/5'}`}>
                <div className="flex items-center gap-3 mb-3">
                  <Calendar size={16} className="text-zinc-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Dates de location</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input 
                    type="date" 
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="bg-transparent text-xs font-bold outline-none text-white w-full"
                  />
                  <input 
                    type="date" 
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="bg-transparent text-xs font-bold outline-none text-white w-full border-l border-white/10 pl-2"
                  />
                </div>
              </div>

              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-red-500 text-[10px] font-black uppercase tracking-widest px-2"
                  >
                    <AlertCircle size={14} /> {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="bg-black/40 border border-white/5 rounded-2xl p-4">
                <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck size={16} className="text-zinc-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Protection</span>
                </div>
                <p className="text-sm font-bold">Pack Sérénité Gold Inclus</p>
              </div>
            </div>

            <button 
              onClick={handleBookingInitiation}
              disabled={isChecking}
              className="w-full py-6 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20 disabled:opacity-70"
            >
              {isChecking ? (
                <>Vérification... <Loader2 size={18} className="animate-spin" /></>
              ) : (
                <>Réserver maintenant <ArrowRight size={18} /></>
              )}
            </button>
            
            <p className="text-center text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-6">
              Aucun frais caché • Annulation gratuite 48h
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
