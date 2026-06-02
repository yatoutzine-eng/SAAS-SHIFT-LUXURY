import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gauge, CheckCircle2, Loader2, User, Mail, Phone, Shield, Car } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays, isWeekend } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

export default function BookingModal({ vehicle, storeSettings, merchantId, onClose }) {
  const { user } = useAuthStore();
  const [range, setRange] = useState();
  const [step, setStep] = useState('dates'); // dates | info | confirm
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [clientInfo, setClientInfo] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    license: '',
  });

  const days = useMemo(() => {
    if (range?.from && range?.to) return Math.max(1, differenceInDays(range.to, range.from));
    return 0;
  }, [range]);

  // Calcul du prix avec tarif weekend
  const totalPrice = useMemo(() => {
    if (!range?.from || !range?.to || days === 0) return 0;
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(range.from);
      d.setDate(d.getDate() + i);
      const isWE = isWeekend(d);
      total += isWE && vehicle.weekend_price ? vehicle.weekend_price : vehicle.price;
    }
    return total;
  }, [range, days, vehicle]);

  const handleConfirm = async () => {
    if (!range?.from || !range?.to || !clientInfo.name || !clientInfo.email) return;
    setIsBooking(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { error } = await supabase.from('bookings').insert({
        merchant_id: merchantId || storeSettings?.user_id,
        vehicle_id: vehicle.id,
        client_id: authUser?.id || null,
        client_name: clientInfo.name,
        client_email: clientInfo.email,
        client_phone: clientInfo.phone,
        client_license: clientInfo.license,
        start_date: range.from.toISOString().split('T')[0],
        end_date: range.to.toISOString().split('T')[0],
        total_price: totalPrice,
        status: 'pending',
        vehicle_model: vehicle.model,
      });

      if (error) throw error;

      // Mettre le véhicule en "loué"
      await supabase.from('fleet').update({ status: 'rented' }).eq('id', vehicle.id);

      setIsSuccess(true);
      setTimeout(onClose, 3000);
    } catch (err) {
      alert('Erreur lors de la réservation : ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />

      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-zinc-950 border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]">

        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2.5 bg-black/50 rounded-full hover:text-[#D4AF37] transition-colors"><X size={20} /></button>

        {/* Gauche — Visuel */}
        <div className="w-full lg:w-2/5 relative h-[220px] lg:h-auto flex-shrink-0">
          {vehicle.image
            ? <img src={vehicle.image} className="w-full h-full object-cover" alt={vehicle.model} />
            : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Car size={48} className="text-zinc-700" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{vehicle.model}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/60 backdrop-blur p-3 rounded-xl flex items-center gap-2">
                <Zap size={14} style={{ color: GOLD }} />
                <span className="text-[10px] font-bold">{vehicle.hp} CV</span>
              </div>
              <div className="bg-black/60 backdrop-blur p-3 rounded-xl flex items-center gap-2">
                <Gauge size={14} style={{ color: GOLD }} />
                <span className="text-[10px] font-bold">{vehicle.speed} km/h</span>
              </div>
            </div>
          </div>
        </div>

        {/* Droite — Formulaire */}
        <div className="flex-1 overflow-y-auto p-8">

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            {['dates', 'info', 'confirm'].map((s, i) => (
              <React.Fragment key={s}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${step === s || (step === 'info' && i <= 1) || step === 'confirm' && i <= 2 ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800 text-zinc-500'}`}>
                  {i + 1}
                </div>
                {i < 2 && <div className={`flex-1 h-0.5 ${(step === 'info' && i === 0) || step === 'confirm' ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`} />}
              </React.Fragment>
            ))}
          </div>

          {/* STEP 1 — Dates */}
          {step === 'dates' && (
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Choisir les dates</h3>
              <p className="text-zinc-500 text-xs mb-6">Le prix varie selon les jours (weekend/semaine)</p>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 mb-6 flex justify-center">
                <style>{`.rdp { --rdp-accent-color: ${GOLD}; color: white; } .rdp-day_selected { background-color: ${GOLD} !important; color: black !important; font-weight: 900; } .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(212,175,55,0.2); }`}</style>
                <DayPicker mode="range" selected={range} onSelect={setRange} locale={fr} disabled={{ before: new Date() }} />
              </div>

              {days > 0 && (
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Durée</span>
                    <span className="text-sm font-black">{days} jour{days > 1 ? 's' : ''}</span>
                  </div>
                  {vehicle.weekend_price && vehicle.weekend_price !== vehicle.price && (
                    <div className="flex justify-between p-3 bg-[#D4AF37]/5 rounded-xl border border-[#D4AF37]/20">
                      <span className="text-[10px] font-black uppercase text-zinc-400">Tarif weekend appliqué</span>
                      <span className="text-[10px] font-black" style={{ color: GOLD }}>{vehicle.weekend_price}€/j</span>
                    </div>
                  )}
                  <div className="flex justify-between p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30">
                    <span className="text-sm font-black uppercase" style={{ color: GOLD }}>Total</span>
                    <span className="text-2xl font-black" style={{ color: GOLD }}>{totalPrice.toLocaleString('fr-FR')}€</span>
                  </div>
                </div>
              )}

              <button disabled={days === 0} onClick={() => setStep('info')}
                className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-40 hover:scale-[1.02] transition-all">
                Continuer →
              </button>
            </div>
          )}

          {/* STEP 2 — Infos client */}
          {step === 'info' && (
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Vos informations</h3>
              <p className="text-zinc-500 text-xs mb-6">Nécessaires pour le contrat de location</p>

              <div className="space-y-4 mb-6">
                {[
                  { key: 'name', label: 'Nom complet', icon: User, type: 'text', required: true },
                  { key: 'email', label: 'Email', icon: Mail, type: 'email', required: true },
                  { key: 'phone', label: 'Téléphone', icon: Phone, type: 'tel', required: false },
                  { key: 'license', label: 'N° Permis de conduire', icon: Shield, type: 'text', required: false },
                ].map(({ key, label, icon: Icon, type, required }) => (
                  <div key={key} className="relative">
                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type={type} placeholder={label + (required ? ' *' : '')} value={clientInfo[key]}
                      onChange={(e) => setClientInfo({ ...clientInfo, [key]: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all" />
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('dates')} className="flex-1 py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/5 transition-all">← Retour</button>
                <button disabled={!clientInfo.name || !clientInfo.email} onClick={() => setStep('confirm')}
                  className="flex-[2] py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-40 hover:scale-[1.02] transition-all">
                  Confirmer →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3 — Confirmation */}
          {step === 'confirm' && (
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Récapitulatif</h3>
              <p className="text-zinc-500 text-xs mb-6">Vérifiez votre réservation avant de valider</p>

              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Véhicule</span><span className="text-sm font-black">{vehicle.model}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Dates</span><span className="text-sm font-bold">{range?.from && format(range.from, 'dd/MM/yy')} → {range?.to && format(range.to, 'dd/MM/yy')}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Client</span><span className="text-sm font-bold">{clientInfo.name}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Email</span><span className="text-sm font-bold">{clientInfo.email}</span></div>
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-sm font-black uppercase" style={{ color: GOLD }}>Total</span>
                  <span className="text-2xl font-black" style={{ color: GOLD }}>{totalPrice.toLocaleString('fr-FR')}€</span>
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep('info')} className="flex-1 py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all">← Retour</button>
                <button disabled={isBooking || isSuccess} onClick={handleConfirm}
                  className="flex-[2] py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  {isBooking ? <Loader2 size={16} className="animate-spin" /> : isSuccess ? <CheckCircle2 size={16} /> : null}
                  {isBooking ? 'Envoi...' : isSuccess ? 'Réservé !' : 'Confirmer la réservation'}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Overlay succès */}
        <AnimatePresence>
          {isSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                <CheckCircle2 size={48} className="text-black" />
              </motion.div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">
                Réservation <span style={{ color: GOLD }}>Envoyée !</span>
              </h2>
              <p className="text-zinc-400 text-sm max-w-xs">
                Le marchand va confirmer votre réservation. Vous serez contacté par email.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
