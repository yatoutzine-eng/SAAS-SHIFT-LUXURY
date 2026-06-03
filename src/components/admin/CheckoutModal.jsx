import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Fuel, Gauge, Camera, CheckCircle2, 
  AlertTriangle, Receipt, ArrowRight, Loader2, Info
} from 'lucide-react';
import { TANK_CAPACITIES, FUEL_PRICE_DEFAULT } from '../../constants/vehicleSpecs';

const GOLD = "#D4AF37";

export default function CheckoutModal({ reservation, onClose, onComplete }) {
  const [fuelLevel, setFuelLevel] = useState(100); // Pourcentage
  const [fuelPrice, setFuelPrice] = useState(FUEL_PRICE_DEFAULT);
  const [mileage, setMileage] = useState("");
  const [dashboardPhoto, setDashboardPhoto] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState('fuel'); // 'fuel' | 'summary'

  const tankCapacity = TANK_CAPACITIES[reservation.vehicle] || TANK_CAPACITIES.DEFAULT;
  
  const fuelStats = useMemo(() => {
    const missingPercentage = 100 - fuelLevel;
    const missingLiters = (tankCapacity * (missingPercentage / 100)).toFixed(1);
    const cost = (missingLiters * fuelPrice).toFixed(2);
    return { missingLiters, cost };
  }, [fuelLevel, fuelPrice, tankCapacity]);

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (prev) => setDashboardPhoto(prev.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleFinalize = async () => {
    setIsProcessing(true);
    // Simulation d'un délai de traitement pour l'effet premium
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    onComplete({
      fuelLevel,
      fuelCost: fuelStats.cost,
      missingLiters: fuelStats.missingLiters,
      finalMileage: mileage,
      closedAt: new Date().toISOString()
    });
    setIsProcessing(false);
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/98 backdrop-blur-3xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center">
              <Receipt size={24} className="text-[#D4AF37]" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tighter">Clôture de Location</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">{reservation.vehicle} • {reservation.id}</p>
            </div>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-all">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            {step === 'fuel' ? (
              <motion.div 
                key="step-fuel"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                {/* Fuel Gauge Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  <div className="space-y-8">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#D4AF37]">Niveau de Carburant</label>
                      <div className="relative pt-10 pb-4">
                        <input 
                          type="range" min="0" max="100" step="5"
                          value={fuelLevel}
                          onChange={(e) => setFuelLevel(parseInt(e.target.value))}
                          className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
                        />
                        <div className="flex justify-between mt-4 text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                          <span>Vide</span>
                          <span>50%</span>
                          <span>Plein</span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-6 bg-black/40 border border-white/5 rounded-3xl">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Prix du Litre</p>
                        <div className="flex items-center gap-2">
                          <input 
                            type="number" step="0.01"
                            value={fuelPrice}
                            onChange={(e) => setFuelPrice(parseFloat(e.target.value))}
                            className="bg-transparent text-xl font-black text-white outline-none w-20"
                          />
                          <span className="text-sm font-bold text-zinc-500">€/L</span>
                        </div>
                      </div>
                      <div className="p-6 bg-black/40 border border-white/5 rounded-3xl">
                        <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-1">Capacité Réservoir</p>
                        <p className="text-xl font-black text-white">{tankCapacity} <span className="text-sm font-bold text-zinc-500">L</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="relative aspect-square flex flex-col items-center justify-center bg-black/40 rounded-[3rem] border border-[#D4AF37]/20 overflow-hidden">
                    <div className="absolute inset-0 opacity-10">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <circle cx="50" cy="50" r="40" fill="none" stroke={GOLD} strokeWidth="0.5" strokeDasharray="2 2" />
                      </svg>
                    </div>
                    
                    <Fuel size={48} className={fuelLevel < 20 ? "text-red-500 animate-pulse" : "text-[#D4AF37]"} />
                    <div className="text-center mt-4">
                      <span className="block text-5xl font-black tracking-tighter text-white">{fuelLevel}%</span>
                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Niveau Actuel</span>
                    </div>

                    {fuelLevel < 100 && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                        className="mt-8 text-center"
                      >
                        <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Frais de remise à niveau</p>
                        <p className="text-3xl font-black text-[#D4AF37]">{fuelStats.cost}€</p>
                        <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">Pour {fuelStats.missingLiters} Litres manquants</p>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Photo & Mileage */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Kilométrage Final</label>
                    <div className="relative">
                      <Gauge className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" size={20} />
                      <input 
                        type="number" placeholder="Ex: 12450"
                        value={mileage}
                        onChange={(e) => setMileage(e.target.value)}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-5 pl-14 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Preuve Tableau de Bord</label>
                    <div className="relative group">
                      <input type="file" accept="image/*" capture="environment" className="hidden" id="dash-photo" onChange={handlePhotoUpload} />
                      <label 
                        htmlFor="dash-photo"
                        className={`w-full h-[68px] rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 cursor-pointer transition-all ${
                          dashboardPhoto ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                      >
                        {dashboardPhoto ? (
                          <>
                            <CheckCircle2 size={20} className="text-[#D4AF37]" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-white">Photo Capturée</span>
                          </>
                        ) : (
                          <>
                            <Camera size={20} className="text-zinc-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Preuve Photo</span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>
                </div>

                <button
                  disabled={!mileage || !dashboardPhoto}
                  onClick={() => setStep('summary')}
                  className="w-full py-6 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-[#D4AF37] disabled:bg-zinc-800 disabled:text-zinc-500 transition-all flex items-center justify-center gap-3"
                >
                  Récapitulatif Final <ArrowRight size={18} />
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="step-summary"
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="theme-card rounded-[2.5rem] p-10 space-y-8">
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-black uppercase tracking-tighter">Facturation de Clôture</h4>
                    <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Calcul basé sur les relevés de retour</p>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Location de base</span>
                      <span className="font-bold">{reservation.amount}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 border-b border-white/5">
                      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Carburant ({fuelStats.missingLiters}L)</span>
                      <span className="font-bold text-[#D4AF37]">+{fuelStats.cost}€</span>
                    </div>
                    <div className="flex justify-between items-center p-6 bg-white/5 rounded-2xl">
                      <span className="text-xs font-black uppercase tracking-widest">Total à Facturer</span>
                      <span className="text-2xl font-black text-[#D4AF37]">
                        {(parseFloat(reservation.amount.replace('€', '').replace(',', '')) + parseFloat(fuelStats.cost)).toLocaleString()}€
                      </span>
                    </div>
                  </div>

                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 flex gap-4">
                    <Info size={20} className="text-blue-500 shrink-0" />
                    <p className="text-[9px] text-blue-200 font-medium leading-relaxed uppercase tracking-wider">
                      En clôturant cette location, le véhicule sera automatiquement remis en statut "DISPONIBLE" et le client recevra sa facture finale par email.
                    </p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep('fuel')}
                    className="flex-1 py-6 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
                  >
                    Modifier les relevés
                  </button>
                  <button
                    onClick={handleFinalize}
                    disabled={isProcessing}
                    className="flex-[2] py-6 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20"
                  >
                    {isProcessing ? <Loader2 className="animate-spin" /> : <><CheckCircle2 size={18} /> Clôturer la location</>}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
