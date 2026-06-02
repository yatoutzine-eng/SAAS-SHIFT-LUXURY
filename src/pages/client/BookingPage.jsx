import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ArrowLeft, CheckCircle2, 
  Zap, Gauge, ShieldCheck, Loader2, Info,
  ChevronRight, TrendingUp
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { calculateStayPrice } from '../../utils/pricingEngine';

const GOLD = "#D4AF37";

export default function BookingPage({ vehicle, initialDates, onBack, storeSettings }) {
  const [startDate, setStartDate] = useState(initialDates?.start || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initialDates?.end || format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Utilisation du moteur de prix pour le séjour complet
  const pricing = useMemo(() => {
    return calculateStayPrice(vehicle.price, startDate, endDate, storeSettings);
  }, [vehicle.price, startDate, endDate, storeSettings]);

  const handleBooking = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      const newBooking = {
        id: `RES-${Math.floor(Math.random() * 9000) + 1000}`,
        vehicleId: vehicle.id,
        vehicleModel: vehicle.model,
        startDate,
        endDate,
        totalPrice: pricing.total,
        status: 'En attente',
        createdAt: new Date().toISOString(),
        hasSurge: pricing.hasSurge
      };

      const existingBookings = JSON.parse(localStorage.getItem('ALL_RESERVATIONS') || '[]');
      localStorage.setItem('ALL_RESERVATIONS', JSON.stringify([newBooking, ...existingBookings]));

      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1500);
  };

  if (isSuccess) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-32 h-32 bg-[#D4AF37] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
          <CheckCircle2 size={64} className="text-black" />
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">Demande <span style={{ color: GOLD }}>Envoyée</span></h2>
        <button onClick={onBack} className="px-12 py-5 border border-[#D4AF37] text-[#D4AF37] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] hover:text-black transition-all">
          Retour au showroom
        </button>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-6xl mx-auto py-8 px-4 md:px-0">
      <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[#D4AF37] transition-colors mb-12">
        <ArrowLeft size={16} /> Annuler et revenir
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        <div className="lg:col-span-7 space-y-8">
          <div className="relative aspect-video rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl">
            <img src={vehicle.image} className="w-full h-full object-cover" alt={vehicle.model} />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
            <div className="absolute bottom-10 left-10">
              <h2 className="text-5xl font-black uppercase tracking-tighter text-white">{vehicle.model}</h2>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {[
              { icon: Zap, label: "Puissance", val: `${vehicle.hp} CV` },
              { icon: Gauge, label: "Vitesse", val: `${vehicle.speed} km/h` },
              { icon: ShieldCheck, label: "Assurance", val: "Premium" }
            ].map((spec, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem] backdrop-blur-md">
                <spec.icon size={20} style={{ color: GOLD }} className="mb-3" />
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">{spec.label}</p>
                <p className="text-sm font-bold text-white">{spec.val}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-zinc-900/60 border border-[#D4AF37]/20 backdrop-blur-3xl rounded-[3rem] p-8 md:p-10 sticky top-32 shadow-2xl">
            <div className="mb-10 flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Configuration <span style={{ color: GOLD }}>Location</span></h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Vérification des disponibilités</p>
              </div>
              {pricing.hasSurge && (
                <motion.div 
                  initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                  className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-full flex items-center gap-2 shadow-lg shadow-[#D4AF37]/20"
                >
                  <TrendingUp size={12} />
                  <span className="text-[8px] font-black uppercase tracking-widest">Tarif Weekend</span>
                </motion.div>
              )}
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Début</label>
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-[#D4AF37] outline-none text-white" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Fin</label>
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-[#D4AF37] outline-none text-white" />
                </div>
              </div>

              <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Durée</span>
                  <span className="text-sm font-bold">{pricing.days} Jours</span>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Total Final</span>
                    <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">TVA et Assurance incluse</p>
                  </div>
                  <span className="text-4xl font-black tracking-tighter text-[#D4AF37]">{pricing.total.toLocaleString()} €</span>
                </div>
              </div>

              <button 
                onClick={handleBooking} disabled={isSubmitting}
                className="w-full py-6 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <>CONFIRMER LA RÉSERVATION <ChevronRight size={18} /></>}
              </button>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
