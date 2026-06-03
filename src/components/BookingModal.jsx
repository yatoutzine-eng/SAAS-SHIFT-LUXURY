import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Gauge, CheckCircle2, Loader2, User, Mail, Phone, Shield, Car, CreditCard, Lock, AlertTriangle } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import { format, differenceInDays, isWeekend, isBefore, isAfter, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import 'react-day-picker/dist/style.css';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";
const DEFAULT_DEPOSIT = 1500;

export default function BookingModal({ vehicle, storeSettings, merchantId, onClose }) {
  const { user } = useAuthStore();
  const [range, setRange] = useState();
  const [step, setStep] = useState('dates');
  const [isBooking, setIsBooking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');
  const [bookedDates, setBookedDates] = useState([]);
  const [isLoadingDates, setIsLoadingDates] = useState(true);
  const [clientInfo, setClientInfo] = useState({
    name: user?.user_metadata?.full_name || '',
    email: user?.email || '',
    phone: '',
    license: '',
  });

  useEffect(() => { loadBookedDates(); }, [vehicle.id]);

  const loadBookedDates = async () => {
    try {
      setIsLoadingDates(true);
      const { data } = await supabase
        .from('bookings')
        .select('start_date, end_date')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'signed', 'in_progress']);
      if (!data) return;
      const blocked = [];
      data.forEach(({ start_date, end_date }) => {
        const start = parseISO(start_date);
        const end = parseISO(end_date);
        let current = new Date(start);
        while (!isAfter(current, end)) {
          blocked.push(new Date(current));
          current.setDate(current.getDate() + 1);
        }
      });
      setBookedDates(blocked);
    } catch (err) { console.error(err); }
    finally { setIsLoadingDates(false); }
  };

  const hasConflict = useMemo(() => {
    if (!range?.from || !range?.to) return false;
    return bookedDates.some(date => !isBefore(date, range.from) && !isAfter(date, range.to));
  }, [range, bookedDates]);

  const days = useMemo(() => {
    if (range?.from && range?.to) return Math.max(1, differenceInDays(range.to, range.from));
    return 0;
  }, [range]);

  const totalPrice = useMemo(() => {
    if (!range?.from || !range?.to || days === 0) return 0;
    let total = 0;
    for (let i = 0; i < days; i++) {
      const d = new Date(range.from);
      d.setDate(d.getDate() + i);
      total += isWeekend(d) && vehicle.weekend_price ? vehicle.weekend_price : vehicle.price;
    }
    return total;
  }, [range, days, vehicle]);

  const depositAmount = vehicle.deposit || DEFAULT_DEPOSIT;

  // ── Email "demande reçue" au client ──
  const sendPendingEmail = async (booking) => {
    try {
      const { data: storeData } = await supabase
        .from('store_settings')
        .select('shop_name')
        .eq('user_id', merchantId || storeSettings?.user_id)
        .maybeSingle();

      await fetch('https://nhdancdcsarrgfmfebop.supabase.co/functions/v1/send-contract-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientEmail: clientInfo.email,
          clientName: clientInfo.name,
          merchantName: storeData?.shop_name || storeSettings?.shop_name || 'Shift Luxury',
          vehicleModel: vehicle.model,
          startDate: range.from.toLocaleDateString('fr-FR'),
          endDate: range.to.toLocaleDateString('fr-FR'),
          duration: days,
          totalPrice,
          reservationId: booking.id,
          isPending: true,
        }),
      });
    } catch (err) { console.error('Email pending error:', err); }
  };

  const handleConfirm = async () => {
    if (!range?.from || !range?.to || !clientInfo.name || !clientInfo.email) return;
    if (hasConflict) { setError('Ces dates sont déjà réservées.'); return; }
    setIsBooking(true);
    setError('');
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      const { data: conflicts } = await supabase
        .from('bookings')
        .select('id')
        .eq('vehicle_id', vehicle.id)
        .in('status', ['confirmed', 'signed', 'in_progress'])
        .lte('start_date', range.to.toISOString().split('T')[0])
        .gte('end_date', range.from.toISOString().split('T')[0]);

      if (conflicts && conflicts.length > 0) {
        setError('Ce véhicule vient d\'être réservé pour ces dates. Choisissez d\'autres dates.');
        setIsBooking(false);
        return;
      }

      const { data: booking, error: bookingError } = await supabase.from('bookings').insert({
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
        deposit_amount: depositAmount,
        deposit_status: 'pending',
      }).select().single();

      if (bookingError) throw bookingError;

      // Envoyer email "demande reçue" au client
      await sendPendingEmail(booking);

      setBookingId(booking.id);
      setStep('deposit');
    } catch (err) {
      setError('Erreur : ' + err.message);
    } finally {
      setIsBooking(false);
    }
  };

  const handlePayDeposit = async () => {
    setIsBooking(true);
    setError('');
    try {
      const res = await fetch('https://nhdancdcsarrgfmfebop.supabase.co/functions/v1/stripe-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId, amount: depositAmount, vehicleModel: vehicle.model, clientEmail: clientInfo.email }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await supabase.from('bookings').update({ stripe_session_id: data.sessionId, deposit_status: 'processing' }).eq('id', bookingId);
      window.location.href = data.url;
    } catch (err) {
      setError('Erreur paiement : ' + err.message);
      setIsBooking(false);
    }
  };

  const handleSkipDeposit = () => { setIsSuccess(true); setTimeout(onClose, 3000); };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 md:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />
      <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-5xl bg-zinc-950 border border-[#D4AF37]/20 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col lg:flex-row max-h-[90vh]">

        <button onClick={onClose} className="absolute top-6 right-6 z-50 p-2.5 bg-black/50 rounded-full hover:text-[#D4AF37] transition-colors">
          <X size={20} />
        </button>

        <div className="w-full lg:w-2/5 relative h-[220px] lg:h-auto flex-shrink-0">
          {vehicle.image
            ? <img src={vehicle.image} className="w-full h-full object-cover" alt={vehicle.model} />
            : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Car size={48} className="text-zinc-700" /></div>}
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent" />
          <div className="absolute bottom-8 left-8 right-8">
            <h2 className="text-3xl font-black uppercase tracking-tighter mb-4">{vehicle.model}</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-black/60 backdrop-blur p-3 rounded-xl flex items-center gap-2">
                <Zap size={14} style={{ color: GOLD }} /><span className="text-[10px] font-bold">{vehicle.hp} CV</span>
              </div>
              <div className="bg-black/60 backdrop-blur p-3 rounded-xl flex items-center gap-2">
                <Gauge size={14} style={{ color: GOLD }} /><span className="text-[10px] font-bold">{vehicle.speed} km/h</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-8">
          {step !== 'deposit' && (
            <div className="flex items-center gap-2 mb-8">
              {['dates', 'info', 'confirm'].map((s, i) => (
                <React.Fragment key={s}>
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    step === s || (step === 'info' && i <= 1) || (step === 'confirm' && i <= 2)
                      ? 'bg-[#D4AF37] text-black' : 'bg-zinc-800 text-zinc-500'
                  }`}>{i + 1}</div>
                  {i < 2 && <div className={`flex-1 h-0.5 ${(step === 'info' && i === 0) || step === 'confirm' ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`} />}
                </React.Fragment>
              ))}
            </div>
          )}

          {step === 'dates' && (
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Choisir les dates</h3>
              <p className="text-zinc-500 text-xs mb-6">Les dates en rouge sont déjà réservées</p>
              {isLoadingDates ? (
                <div className="flex items-center justify-center py-12"><Loader2 size={24} className="animate-spin text-[#D4AF37]" /></div>
              ) : (
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-4 mb-4 flex justify-center">
                  <style>{`
                    .rdp { --rdp-accent-color: ${GOLD}; color: white; }
                    .rdp-day_selected { background-color: ${GOLD} !important; color: black !important; font-weight: 900; }
                    .rdp-button:hover:not([disabled]):not(.rdp-day_selected) { background-color: rgba(212,175,55,0.2); }
                    .rdp-day_disabled { color: #ef4444 !important; text-decoration: line-through; opacity: 0.6; }
                  `}</style>
                  <DayPicker mode="range" selected={range} onSelect={(r) => { setRange(r); setError(''); }}
                    locale={fr} disabled={[{ before: new Date() }, ...bookedDates]} />
                </div>
              )}
              {hasConflict && (
                <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl mb-4">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0" />
                  <p className="text-red-400 text-[10px] font-black uppercase">Ces dates sont déjà réservées</p>
                </div>
              )}
              {days > 0 && !hasConflict && (
                <div className="space-y-2 mb-6">
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Durée</span>
                    <span className="text-sm font-black">{days} jour{days > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-white/5 rounded-xl">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Caution bloquée</span>
                    <span className="text-sm font-black text-zinc-400">{depositAmount.toLocaleString('fr-FR')} €</span>
                  </div>
                  <div className="flex justify-between p-4 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/30">
                    <span className="text-sm font-black uppercase" style={{ color: GOLD }}>Total location</span>
                    <span className="text-2xl font-black" style={{ color: GOLD }}>{totalPrice.toLocaleString('fr-FR')} €</span>
                  </div>
                </div>
              )}
              <button disabled={days === 0 || hasConflict} onClick={() => setStep('info')}
                className="w-full py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-40 hover:scale-[1.02] transition-all">
                Continuer →
              </button>
            </div>
          )}

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
                  Continuer →
                </button>
              </div>
            </div>
          )}

          {step === 'confirm' && (
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight mb-2">Récapitulatif</h3>
              <p className="text-zinc-500 text-xs mb-6">Vérifiez avant de valider</p>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-3 mb-6">
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Véhicule</span><span className="text-sm font-black">{vehicle.model}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Dates</span><span className="text-sm font-bold">{range?.from && format(range.from, 'dd/MM/yy')} → {range?.to && format(range.to, 'dd/MM/yy')}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Durée</span><span className="text-sm font-bold">{days} jour{days > 1 ? 's' : ''}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Client</span><span className="text-sm font-bold">{clientInfo.name}</span></div>
                <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Caution</span><span className="text-sm font-bold text-zinc-400">{depositAmount.toLocaleString('fr-FR')} €</span></div>
                <div className="flex justify-between border-t border-white/10 pt-3">
                  <span className="text-sm font-black uppercase" style={{ color: GOLD }}>Total location</span>
                  <span className="text-2xl font-black" style={{ color: GOLD }}>{totalPrice.toLocaleString('fr-FR')} €</span>
                </div>
              </div>
              {error && <p className="text-red-400 text-[10px] font-bold mb-4">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('info')} className="flex-1 py-4 border border-white/10 rounded-2xl font-black uppercase text-[10px] hover:bg-white/5 transition-all">← Retour</button>
                <button disabled={isBooking} onClick={handleConfirm}
                  className="flex-[2] py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest disabled:opacity-60 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                  {isBooking ? <Loader2 size={16} className="animate-spin" /> : null}
                  {isBooking ? 'Envoi...' : 'Confirmer →'}
                </button>
              </div>
            </div>
          )}

          {step === 'deposit' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="text-center">
                <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CreditCard size={24} style={{ color: GOLD }} />
                </div>
                <h3 className="text-xl font-black uppercase tracking-tight mb-2">Caution <span style={{ color: GOLD }}>Sécurisée</span></h3>
                <p className="text-zinc-500 text-xs">Une caution de <span className="text-white font-black">{depositAmount.toLocaleString('fr-FR')} €</span> sera prélevée et remboursée après le retour.</p>
              </div>
              <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 space-y-3">
                <div className="flex justify-between text-xs"><span className="text-zinc-500 font-bold uppercase">Véhicule</span><span className="font-black">{vehicle.model}</span></div>
                <div className="flex justify-between text-xs"><span className="text-zinc-500 font-bold uppercase">Location</span><span className="font-black">{totalPrice.toLocaleString('fr-FR')} €</span></div>
                <div className="flex justify-between text-xs border-t border-white/10 pt-3"><span className="text-zinc-500 font-bold uppercase">Caution</span><span className="font-black" style={{ color: GOLD }}>{depositAmount.toLocaleString('fr-FR')} €</span></div>
              </div>
              <div className="flex items-center justify-center gap-2 text-zinc-600">
                <Lock size={11} /><span className="text-[9px] font-bold uppercase tracking-widest">Paiement sécurisé par Stripe</span>
              </div>
              {error && <p className="text-red-400 text-[10px] font-bold text-center">{error}</p>}
              <div className="space-y-3">
                <button onClick={handlePayDeposit} disabled={isBooking}
                  className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
                  {isBooking ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
                  {isBooking ? 'Redirection Stripe...' : `Payer la caution — ${depositAmount.toLocaleString('fr-FR')} €`}
                </button>
                <button onClick={handleSkipDeposit} className="w-full py-3 text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-all">
                  Continuer sans caution
                </button>
              </div>
            </motion.div>
          )}
        </div>

        <AnimatePresence>
          {isSuccess && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center text-center p-12">
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
                <CheckCircle2 size={48} className="text-black" />
              </motion.div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-4">Réservation <span style={{ color: GOLD }}>Envoyée !</span></h2>
              <p className="text-zinc-400 text-sm max-w-xs">Votre demande a été reçue. Un email de confirmation vous a été envoyé. Le marchand va confirmer votre réservation.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

