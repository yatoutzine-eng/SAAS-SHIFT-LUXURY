import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Calendar as CalendarIcon, ArrowLeft, CheckCircle2, 
  Zap, Gauge, ShieldCheck, Loader2,
  ChevronRight, TrendingUp, CreditCard, Lock
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { calculateStayPrice } from '../../utils/pricingEngine';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

// Montant caution par défaut (modifiable par véhicule)
const DEFAULT_DEPOSIT = 1500;

export default function BookingPage({ vehicle, initialDates, onBack, storeSettings }) {
  const [startDate, setStartDate] = useState(initialDates?.start || format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(initialDates?.end || format(addDays(new Date(), 3), 'yyyy-MM-dd'));
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState('form'); // 'form' | 'deposit' | 'success'
  const [bookingId, setBookingId] = useState(null);
  const [error, setError] = useState('');

  const pricing = useMemo(() => {
    return calculateStayPrice(vehicle.price, startDate, endDate, storeSettings);
  }, [vehicle.price, startDate, endDate, storeSettings]);

  const depositAmount = vehicle.deposit || DEFAULT_DEPOSIT;

  // ── Étape 1 : Créer la réservation dans Supabase ──────────────────────────
  const handleBooking = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Vous devez être connecté');

      // Récupérer le profil client
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      // Créer la réservation
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          merchant_id: storeSettings.user_id,
          vehicle_id: vehicle.id,
          vehicle_model: vehicle.model,
          client_id: user.id,
          client_email: user.email,
          client_name: profile?.full_name || user.email,
          client_phone: profile?.phone || '',
          start_date: startDate,
          end_date: endDate,
          total_price: pricing.total,
          status: 'pending',
          deposit_amount: depositAmount,
          deposit_status: 'pending',
          created_at: new Date(),
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      setBookingId(booking.id);
      setStep('deposit');
    } catch (err) {
      setError(err.message || 'Erreur lors de la réservation');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Étape 2 : Payer la caution via Stripe ─────────────────────────────────
  const handlePayDeposit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            action: 'create_deposit',
            bookingId,
            amount: depositAmount,
            vehicleModel: vehicle.model,
            clientEmail: user.email,
          }),
        }
      );

      const data = await res.json();
      if (data.error) throw new Error(data.error);

      // Sauvegarder le sessionId dans la réservation
      await supabase.from('bookings').update({
        stripe_session_id: data.sessionId,
        deposit_status: 'processing',
      }).eq('id', bookingId);

      // Rediriger vers Stripe Checkout
      window.location.href = data.url;

    } catch (err) {
      setError(err.message || 'Erreur paiement');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Étape 2 bis : Passer sans caution (si pas configuré) ─────────────────
  const handleSkipDeposit = async () => {
    setStep('success');
  };

  // ── Succès ────────────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="min-h-[80vh] flex flex-col items-center justify-center text-center px-6">
        <div className="w-32 h-32 bg-[#D4AF37] rounded-full flex items-center justify-center mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
          <CheckCircle2 size={64} className="text-black" />
        </div>
        <h2 className="text-5xl font-black uppercase tracking-tighter mb-4">
          Demande <span style={{ color: GOLD }}>Envoyée</span>
        </h2>
        <p className="text-zinc-500 text-sm mb-8">L'agence va confirmer votre réservation sous peu.</p>
        <button onClick={onBack}
          className="px-12 py-5 border border-[#D4AF37] text-[#D4AF37] rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] hover:text-black transition-all">
          Retour au showroom
        </button>
      </motion.div>
    );
  }

  // ── Étape caution ─────────────────────────────────────────────────────────
  if (step === 'deposit') {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto py-16 px-4">
        <div className="bg-zinc-900/60 border border-[#D4AF37]/20 rounded-[3rem] p-10 text-center space-y-8">
          <div className="w-16 h-16 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center mx-auto">
            <CreditCard size={28} style={{ color: GOLD }} />
          </div>

          <div>
            <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
              Caution <span style={{ color: GOLD }}>Sécurisée</span>
            </h3>
            <p className="text-zinc-500 text-xs">
              Une caution de <span className="text-white font-black">{depositAmount.toLocaleString('fr-FR')} €</span> sera
              bloquée sur votre carte. Elle sera libérée automatiquement après le retour du véhicule.
            </p>
          </div>

          {/* Récap */}
          <div className="bg-black/30 rounded-2xl p-6 space-y-3 text-left">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-bold uppercase">Véhicule</span>
              <span className="font-black">{vehicle.model}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-zinc-500 font-bold uppercase">Location</span>
              <span className="font-black">{pricing.total.toLocaleString('fr-FR')} €</span>
            </div>
            <div className="flex justify-between text-xs border-t border-white/10 pt-3">
              <span className="text-zinc-500 font-bold uppercase">Caution bloquée</span>
              <span className="font-black" style={{ color: GOLD }}>{depositAmount.toLocaleString('fr-FR')} €</span>
            </div>
          </div>

          <div className="flex items-center gap-2 justify-center text-zinc-600">
            <Lock size={12} />
            <span className="text-[9px] font-bold uppercase tracking-widest">Paiement sécurisé par Stripe</span>
          </div>

          {error && (
            <p className="text-red-400 text-xs font-bold">{error}</p>
          )}

          <div className="space-y-3">
            <button onClick={handlePayDeposit} disabled={isSubmitting}
              className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-50">
              {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={16} />}
              {isSubmitting ? 'Redirection...' : `Payer la caution — ${depositAmount.toLocaleString('fr-FR')} €`}
            </button>
            <button onClick={handleSkipDeposit}
              className="w-full py-3 text-zinc-600 text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-all">
              Continuer sans caution
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // ── Formulaire principal ──────────────────────────────────────────────────
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto py-8 px-4 md:px-0">
      <button onClick={onBack}
        className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[#D4AF37] transition-colors mb-12">
        <ArrowLeft size={16} /> Annuler et revenir
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Gauche — image + specs */}
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
              { icon: Zap,       label: "Puissance", val: `${vehicle.hp || '—'} CV` },
              { icon: Gauge,     label: "Vitesse",   val: `${vehicle.speed || '—'} km/h` },
              { icon: ShieldCheck, label: "Assurance", val: "Premium" }
            ].map((spec, i) => (
              <div key={i} className="bg-zinc-900/40 border border-white/5 p-6 rounded-[2rem]">
                <spec.icon size={20} style={{ color: GOLD }} className="mb-3" />
                <p className="text-[8px] font-black uppercase tracking-widest text-zinc-500 mb-1">{spec.label}</p>
                <p className="text-sm font-bold">{spec.val}</p>
              </div>
            ))}
          </div>

          {/* Info caution */}
          <div className="flex items-start gap-4 p-5 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl">
            <Lock size={16} style={{ color: GOLD }} className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[10px] font-black uppercase text-[#D4AF37] mb-1">Caution sécurisée</p>
              <p className="text-[10px] text-zinc-500 font-bold">
                Une caution de <span className="text-white">{depositAmount.toLocaleString('fr-FR')} €</span> sera
                bloquée via Stripe et libérée après le retour du véhicule. Vous ne serez pas débité sauf dommages.
              </p>
            </div>
          </div>
        </div>

        {/* Droite — formulaire */}
        <div className="lg:col-span-5">
          <div className="bg-zinc-900/60 border border-[#D4AF37]/20 backdrop-blur-3xl rounded-[3rem] p-8 md:p-10 sticky top-32 shadow-2xl space-y-8">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">
                  Configuration <span style={{ color: GOLD }}>Location</span>
                </h3>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Choisissez vos dates</p>
              </div>
              {pricing.hasSurge && (
                <div className="px-3 py-1.5 bg-[#D4AF37] text-black rounded-full flex items-center gap-2">
                  <TrendingUp size={12} />
                  <span className="text-[8px] font-black uppercase">Weekend</span>
                </div>
              )}
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Début</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                  min={format(addDays(new Date(), 1), 'yyyy-MM-dd')}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-[#D4AF37] outline-none text-white" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Fin</label>
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                  min={startDate}
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold focus:border-[#D4AF37] outline-none text-white" />
              </div>
            </div>

            {/* Récap prix */}
            <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-zinc-500">Durée</span>
                <span className="text-sm font-bold">{pricing.days} Jour{pricing.days > 1 ? 's' : ''}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-zinc-500">Caution bloquée</span>
                <span className="text-sm font-bold text-zinc-400">{depositAmount.toLocaleString('fr-FR')} €</span>
              </div>
              <div className="pt-4 border-t border-white/10 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-black uppercase" style={{ color: GOLD }}>Total Location</span>
                  <p className="text-[8px] text-zinc-600 font-bold uppercase mt-1">Assurance incluse</p>
                </div>
                <span className="text-4xl font-black tracking-tighter" style={{ color: GOLD }}>
                  {pricing.total.toLocaleString()} €
                </span>
              </div>
            </div>

            {error && (
              <p className="text-red-400 text-[10px] font-bold uppercase text-center">{error}</p>
            )}

            <button onClick={handleBooking} disabled={isSubmitting}
              className="w-full py-6 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/20 disabled:opacity-50">
              {isSubmitting
                ? <Loader2 size={20} className="animate-spin" />
                : <><ChevronRight size={18} /> Confirmer la réservation</>
              }
            </button>

            <div className="flex items-center justify-center gap-2 text-zinc-700">
              <Lock size={11} />
              <span className="text-[9px] font-bold uppercase tracking-widest">Paiement sécurisé Stripe</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

