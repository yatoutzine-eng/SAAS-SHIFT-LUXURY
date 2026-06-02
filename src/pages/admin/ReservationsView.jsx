import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, CheckCircle, PenTool, Flag, 
  ShieldCheck, RefreshCw, User, Car, Calendar
} from 'lucide-react';
import ContractModal from '../../components/admin/ContractModal';
import InspectionModal from '../../components/admin/InspectionModal';
import CheckoutModal from '../../components/admin/CheckoutModal';
import ClientModal from '../../components/admin/ClientModal';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

const STATUS_STYLES = {
  'pending':    { bg: 'bg-amber-500/10',   text: 'text-amber-400',   border: 'border-amber-500/20',   dot: 'bg-amber-400',   label: 'En attente' },
  'confirmed':  { bg: 'bg-[#D4AF37]/10',   text: 'text-[#D4AF37]',   border: 'border-[#D4AF37]/20',   dot: 'bg-[#D4AF37]',   label: 'Confirmé' },
  'signed':     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/20', dot: 'bg-emerald-400', label: 'Signé' },
  'in_progress':{ bg: 'bg-blue-500/10',    text: 'text-blue-400',    border: 'border-blue-500/20',    dot: 'bg-blue-400',    label: 'En cours' },
  'completed':  { bg: 'bg-zinc-800',       text: 'text-zinc-400',    border: 'border-white/10',       dot: 'bg-zinc-500',    label: 'Terminé' },
  'cancelled':  { bg: 'bg-red-500/10',     text: 'text-red-400',     border: 'border-red-500/20',     dot: 'bg-red-400',     label: 'Annulé' },
};

export default function ReservationsView() {
  const [filter, setFilter] = useState('all');
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [contractRes, setContractRes] = useState(null);
  const [inspectionRes, setInspectionRes] = useState(null);
  const [checkoutRes, setCheckoutRes] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => { loadReservations(); }, []);

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase
        .from('bookings')
        .select('*, fleet(model, image, price)')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      setReservations(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const updateStatus = async (id, status, extraData = {}) => {
    try {
      const { error } = await supabase.from('bookings').update({ status, ...extraData, updated_at: new Date() }).eq('id', id);
      if (error) throw error;
      await loadReservations();
    } catch (err) { alert('Erreur : ' + err.message); }
  };

  const handleSignContract = async (sig) => {
    await updateStatus(contractRes.id, 'signed', { contract_signature: sig, signed_at: new Date() });
    setContractRes(null);
  };

  const handleInspectionComplete = async (photos) => {
    await updateStatus(inspectionRes.id, 'in_progress', { inspection_photos: photos, check_in_date: new Date() });
    setInspectionRes(null);
  };

  const handleCheckoutComplete = async (data) => {
    await updateStatus(checkoutRes.id, 'completed', { checkout_data: data, completed_at: new Date() });
    if (checkoutRes.vehicle_id) await supabase.from('fleet').update({ status: 'available' }).eq('id', checkoutRes.vehicle_id);
    setCheckoutRes(null);
  };

  const adaptForModal = (res) => ({
    ...res,
    vehicle: res.fleet?.model || 'Véhicule',
    client: { name: res.client_name || 'Client', email: res.client_email || '', phone: res.client_phone || '', license: res.client_license || '' },
    startDate: res.start_date,
    endDate: res.end_date,
    totalPrice: res.total_price,
  });

  const filters = [
    { key: 'all', label: 'Toutes' },
    { key: 'pending', label: 'En attente' },
    { key: 'confirmed', label: 'Confirmées' },
    { key: 'signed', label: 'Signées' },
    { key: 'in_progress', label: 'En cours' },
    { key: 'completed', label: 'Terminées' },
  ];

  const filtered = filter === 'all' ? reservations : reservations.filter(r => r.status === filter);

  const renderActions = (res) => {
    switch (res.status) {
      case 'pending':
        return (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(res.id, 'confirmed')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/20 transition-all">✓ Confirmer</button>
            <button onClick={() => updateStatus(res.id, 'cancelled')} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all">✕ Refuser</button>
          </div>
        );
      case 'confirmed':
        return <button onClick={() => setContractRes(adaptForModal(res))} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"><PenTool size={14} /> Contrat</button>;
      case 'signed':
        return <button onClick={() => setInspectionRes(adaptForModal(res))} className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"><ShieldCheck size={14} /> Check-in</button>;
      case 'in_progress':
        return <button onClick={() => setCheckoutRes(adaptForModal(res))} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"><Flag size={14} /> Retour</button>;
      case 'completed':
        return <div className="flex items-center gap-2 text-zinc-500"><CheckCircle size={14} className="text-emerald-500" /><span className="text-[9px] font-black uppercase">Clôturé</span></div>;
      default: return null;
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Réservations</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{reservations.length} réservation{reservations.length > 1 ? 's' : ''} — Supabase</p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={loadReservations} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"><RefreshCw size={16} /></button>
          <div className="flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
            {filters.map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)}
                className={`whitespace-nowrap px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f.key ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}>
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
          <Calendar size={32} className="text-zinc-700 mb-4" />
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">{filter === 'all' ? 'Aucune réservation' : 'Aucun résultat'}</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase">{filter === 'all' ? 'Les réservations apparaîtront ici' : 'Changez de filtre'}</p>
        </div>
      ) : (
        <div className="bg-zinc-950/50 border border-white/5 rounded-[2.5rem] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Client</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Véhicule</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Dates</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Montant</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Statut</th>
                <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.02]">
              {filtered.map((res) => {
                const s = STATUS_STYLES[res.status] || STATUS_STYLES['pending'];
                return (
                  <tr key={res.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="px-8 py-6">
                      {/* Clic sur le client → fiche client */}
                      <button onClick={() => setSelectedClient(res)}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left">
                        <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center border border-white/10 hover:border-[#D4AF37]/50 transition-all">
                          <User size={16} className="text-zinc-500" />
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white hover:text-[#D4AF37] transition-colors">{res.client_name || 'Client'}</div>
                          <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{res.id?.slice(0, 8).toUpperCase()}</div>
                        </div>
                      </button>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <Car size={14} className="text-zinc-600" />
                        <span className="text-sm text-zinc-300">{res.fleet?.model || '—'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs text-zinc-400 font-bold">
                        {res.start_date ? new Date(res.start_date).toLocaleDateString('fr-FR') : '—'}
                        {res.end_date ? ` → ${new Date(res.end_date).toLocaleDateString('fr-FR')}` : ''}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-black" style={{ color: GOLD }}>
                        {res.total_price ? `${res.total_price.toLocaleString('fr-FR')}€` : '—'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${s.bg} ${s.text} ${s.border}`}>
                        <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`} />
                        {s.label}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end">{renderActions(res)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <AnimatePresence>
        {contractRes && <ContractModal reservation={contractRes} onClose={() => setContractRes(null)} onSign={handleSignContract} />}
        {inspectionRes && <InspectionModal reservation={inspectionRes} onClose={() => setInspectionRes(null)} onComplete={handleInspectionComplete} />}
        {checkoutRes && <CheckoutModal reservation={checkoutRes} onClose={() => setCheckoutRes(null)} onComplete={handleCheckoutComplete} />}
        {selectedClient && <ClientModal reservation={selectedClient} onClose={() => setSelectedClient(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}
