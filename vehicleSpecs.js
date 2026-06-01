import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gauge, CheckCircle2, Loader2 } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';

const GOLD = "#D4AF37";

export default function BookingModal({ vehicle, agency, onClose, onConfirm }) {
  const [range, setRange] = useState();
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const days = useMemo(() => {
    if (range?.from && range?.to) {
      const diff = differenceInDays(range.to, range.from);
      return Math.max(1, diff);
    }
    return 0;
  }, [range]);

  const totalPrice = days * vehicle.price;

  const handleConfirm = () => {
    if (!range?.from || !range?.to) return;
    
    setIsBooking(true);
    setTimeout(() => {
      setIsBooking(false);
      setIsSuccess(true);
      onConfirm({
        id: Date.now(),
        vehicleId: vehicle.id,
        vehicleModel: vehicle.model,
        agencyName: agency.name,
        startDate: range.from.toISOString(),
        endDate: range.to.toISOString(),
        totalPrice,
        status: 'Confirmée'
      });
      setTimeout(onClose, 2500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-6xl bg-zinc-950 border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(212,175,55,0.15)] flex flex-col lg:flex-row"
      >
        <button onClick={onClose} className="absolute top-8 right-8 z-50 p-3 bg-black/50 rounded-full text-white hover:text-[#D4AF37] transition-colors">
          <X size={24} />
        </button>

        {/* Gauche: Visuel & Specs */}
        <div className="w-full lg:w-1/2 relative h-[300px] lg:h-auto">
          <img src={vehicle.image} className="w-full h-full object-cover" alt={vehicle.model} />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
          <div className="absolute bottom-12 left-12 right-12">
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-6">{vehicle.model}</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <Zap size={20} style={{ color: GOLD }} />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Puissance</p>
                  <p className="text-sm font-bold">{vehicle.hp} CV</p>
                </div>
              </div>
              <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-center gap-4">
                <Gauge size={20} style={{ color: GOLD }} />
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500">Vitesse Max</p>
                  <p className="text-sm font-bold">{vehicle.speed} KM/H</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Droite: Calendrier & Prix */}
        <div className="flex-1 p-8 lg:p-12 overflow-y-auto custom-scrollbar max-h-[80vh] lg:max-h-none">
          <div className="mb-8">
            <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#D4AF37] mb-2">Réservation Conciergerie</h3>
            <p className="text-zinc-400 text-sm">Sélectionnez vos dates de location pour {agency.name}.</p>
          </div>

          <div className="bg-zinc-900/50 border border-white/5 rounded-3xl p-6 mb-8 flex justify-center">
            <style>{`
              .rdp { --rdp-accent-color: ${GOLD}; --rdp-background-color: rgba(212, 175, 55, 0.1); color: white; }
              .rdp-day_selected { background-color: ${GOLD} !important; color: black !important; font-weight: 900; }
              .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(212, 175, 55, 0.2); }
            `}</style>
            <DayPicker
              mode="range"
              selected={range}
              onSelect={setRange}
              locale={fr}
              disabled={{ before: new Date() }}
            />
          </div>

          <div className="space-y-4 mb-8">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Prix Journalier</span>
              <span className="font-bold">{vehicle.price} €</span>
            </div>
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Durée</span>
              <span className="font-bold">{days} Jours</span>
            </div>
            <div className="flex justify-between items-center p-6 bg-[#D4AF37]/10 rounded-2xl border border-[#D4AF37]/20">
              <span className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Total Estimé</span>
              <span className="text-2xl font-black text-[#D4AF37]">{totalPrice.toLocaleString()} €</span>
            </div>
          </div>

          <button 
            disabled={!range?.to || isBooking || isSuccess}
            onClick={handleConfirm}
            className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#D4AF37] disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)]"
          >
            {isBooking ? (
              <Loader2 size={20} className="animate-spin" />
            ) : isSuccess ? (
              <CheckCircle2 size={20} />
            ) : (
              "Confirmer la réservation"
            )}
            {isSuccess ? "RÉSERVÉ AVEC SUCCÈS" : isBooking ? "TRAITEMENT..." : "VALIDER MON CHOIX"}
          </button>
        </div>

        {/* Overlay de Succès */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-[60] bg-black flex flex-col items-center justify-center text-center p-12"
            >
              <motion.div 
                initial={{ scale: 0, rotate: -20 }} animate={{ scale: 1, rotate: 0 }}
                className="w-32 h-32 bg-[#D4AF37] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]"
              >
                <CheckCircle2 size={64} className="text-black" />
              </motion.div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Réservation <span style={{ color: GOLD }}>Confirmée</span></h2>
              <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs max-w-xs">
                Votre véhicule sera prêt à l'agence {agency.name} le {range?.from && format(range.from, 'dd MMMM', { locale: fr })}.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
