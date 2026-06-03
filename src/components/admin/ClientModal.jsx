import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Phone, Mail, Car, Calendar, DollarSign, FileText, Shield, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

const STATUS_STYLES = {
  'pending':     { text: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'En attente' },
  'confirmed':   { text: 'text-[#D4AF37]',   bg: 'bg-[#D4AF37]/10',   label: 'Confirmé' },
  'signed':      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Signé' },
  'in_progress': { text: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'En cours' },
  'completed':   { text: 'text-zinc-400',    bg: 'bg-zinc-800',       label: 'Terminé' },
  'cancelled':   { text: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Annulé' },
};

export default function ClientModal({ reservation, onClose }) {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('info');

  useEffect(() => { loadClientHistory(); }, []);

  const loadClientHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !reservation.client_email) { setIsLoading(false); return; }

      const { data } = await supabase
        .from('bookings')
        .select('*, fleet(model, image)')
        .eq('merchant_id', user.id)
        .eq('client_email', reservation.client_email)
        .order('created_at', { ascending: false });

      setHistory(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const totalSpent = history
    .filter(b => ['completed', 'in_progress', 'signed'].includes(b.status))
    .reduce((sum, b) => sum + (b.total_price || 0), 0);

  const completedTrips = history.filter(b => b.status === 'completed').length;

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={onClose} />

      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-black/20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-[#D4AF37]/10 border border-[#D4AF37]/20 rounded-2xl flex items-center justify-center">
              <User size={24} style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tighter">{reservation.client_name || 'Client'}</h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Fiche Client</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:text-[#D4AF37] transition-colors"><X size={24} /></button>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-3 border-b border-white/5">
          {[
            { label: 'Total dépensé', value: `${totalSpent.toLocaleString('fr-FR')}€`, icon: DollarSign, color: GOLD },
            { label: 'Locations', value: history.length.toString(), icon: Car, color: '#60a5fa' },
            { label: 'Terminées', value: completedTrips.toString(), icon: CheckCircle, color: '#34d399' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="p-6 text-center border-r border-white/5 last:border-0">
              <Icon size={16} style={{ color }} className="mx-auto mb-2" />
              <p className="text-xl font-black" style={{ color }}>{value}</p>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest mt-1">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {[{ key: 'info', label: 'Informations' }, { key: 'history', label: 'Historique' }].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className={`flex-1 py-4 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.key ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-zinc-500 hover:text-white'}`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Contenu */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">
            {activeTab === 'info' && (
              <motion.div key="info" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">

                {/* Infos contact */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 divide-y divide-white/5">
                  {[
                    { icon: User, label: 'Nom complet', value: reservation.client_name || '—' },
                    { icon: Mail, label: 'Email', value: reservation.client_email || '—' },
                    { icon: Phone, label: 'Téléphone', value: reservation.client_phone || '—' },
                    { icon: Shield, label: 'N° Permis', value: reservation.client_license || '—' },
                  ].map(({ icon: Icon, label, value }) => (
                    <div key={label} className="flex items-center gap-4 p-5">
                      <div className="w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center flex-shrink-0">
                        <Icon size={14} className="text-zinc-500" />
                      </div>
                      <div>
                        <p className="text-[9px] text-zinc-500 font-black uppercase tracking-widest">{label}</p>
                        <p className="text-sm font-bold mt-0.5">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Réservation actuelle */}
                <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-6">
                  <p className="text-[9px] font-black uppercase tracking-widest mb-4" style={{ color: GOLD }}>Réservation en cours</p>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase">Véhicule</p>
                      <p className="font-bold mt-1">{reservation.fleet?.model || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase">Montant</p>
                      <p className="font-bold mt-1" style={{ color: GOLD }}>{reservation.total_price ? `${reservation.total_price.toLocaleString('fr-FR')}€` : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase">Départ</p>
                      <p className="font-bold mt-1">{reservation.start_date ? new Date(reservation.start_date).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-zinc-500 font-black uppercase">Retour</p>
                      <p className="font-bold mt-1">{reservation.end_date ? new Date(reservation.end_date).toLocaleDateString('fr-FR') : '—'}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'history' && (
              <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
                {isLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : history.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-zinc-500 text-sm font-bold uppercase">Aucun historique</p>
                  </div>
                ) : (
                  history.map(b => {
                    const s = STATUS_STYLES[b.status] || STATUS_STYLES['pending'];
                    return (
                      <div key={b.id} className="flex items-center gap-4 p-5 bg-zinc-900/30 border border-white/5 rounded-2xl">
                        <div className="w-12 h-12 bg-zinc-800 rounded-xl overflow-hidden flex-shrink-0">
                          {b.fleet?.image
                            ? <img src={b.fleet.image} className="w-full h-full object-cover" alt="" />
                            : <Car size={20} className="text-zinc-600 m-auto mt-3" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black uppercase truncate">{b.fleet?.model || 'Véhicule'}</p>
                          <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                            {b.start_date ? new Date(b.start_date).toLocaleDateString('fr-FR') : '—'}
                            {b.end_date ? ` → ${new Date(b.end_date).toLocaleDateString('fr-FR')}` : ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black" style={{ color: GOLD }}>{b.total_price ? `${b.total_price.toLocaleString('fr-FR')}€` : '—'}</p>
                          <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                        </div>
                      </div>
                    );
                  })
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
