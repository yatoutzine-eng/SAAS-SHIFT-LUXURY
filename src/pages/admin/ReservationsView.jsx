import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle, PenTool, Flag, 
  ShieldCheck, RefreshCw, User, Car, Calendar,
  Download, Loader2, Unlock, CreditCard
} from 'lucide-react';
import ContractModal from '../../components/admin/ContractModal';
import ChecklistModal from '../../components/admin/ChecklistModal';
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

const generatePDF = (reservations, filter, agencyName) => {
  const statusLabel = { all: 'Toutes', pending: 'En attente', confirmed: 'Confirmées', signed: 'Signées', in_progress: 'En cours', completed: 'Terminées' };
  const totalRevenue = reservations.filter(r => ['completed','in_progress','signed','confirmed'].includes(r.status)).reduce((sum, r) => sum + (r.total_price || 0), 0);
  const today = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  const statusColors = { pending: '#F59E0B', confirmed: '#D4AF37', signed: '#10B981', in_progress: '#3B82F6', completed: '#6B7280', cancelled: '#EF4444' };
  const rows = reservations.map((r, i) => {
    const s = STATUS_STYLES[r.status] || STATUS_STYLES['pending'];
    const color = statusColors[r.status] || '#999';
    return `<tr style="background:${i % 2 === 0 ? '#111' : '#0D0D0D'}"><td style="padding:14px 16px;font-size:12px;color:#fff;font-weight:700">${r.client_name || 'Client'}</td><td style="padding:14px 16px;font-size:12px;color:#aaa">${r.fleet?.model || r.vehicle_model || '—'}</td><td style="padding:14px 16px;font-size:11px;color:#aaa">${r.start_date ? new Date(r.start_date).toLocaleDateString('fr-FR') : '—'}${r.end_date ? ' → ' + new Date(r.end_date).toLocaleDateString('fr-FR') : ''}</td><td style="padding:14px 16px;font-size:13px;color:#D4AF37;font-weight:900">${r.total_price ? r.total_price.toLocaleString('fr-FR') + ' €' : '—'}</td><td style="padding:14px 16px"><span style="background:${color}22;color:${color};border:1px solid ${color}44;padding:4px 10px;border-radius:20px;font-size:10px;font-weight:900;text-transform:uppercase">${s.label}</span></td></tr>`;
  }).join('');
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Export — ${agencyName||'Shift Luxury'}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{background:#000;color:#fff;font-family:'Helvetica Neue',Arial,sans-serif;padding:48px}</style></head><body><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:32px;border-bottom:1px solid #222"><div><div style="font-size:28px;font-weight:900;text-transform:uppercase;letter-spacing:-0.04em">Export <span style="color:#D4AF37">Réservations</span></div><div style="font-size:11px;color:#666;font-weight:700;text-transform:uppercase;margin-top:6px">Filtre : ${statusLabel[filter]||'Toutes'} · ${today}</div></div><div style="text-align:right"><div style="font-size:11px;color:#666;font-weight:700;text-transform:uppercase;margin-bottom:4px">Total</div><div style="font-size:36px;font-weight:900">${reservations.length}</div></div></div><div style="border:1px solid #1a1a1a;border-radius:20px;overflow:hidden"><table style="width:100%;border-collapse:collapse"><thead><tr style="background:#0a0a0a;border-bottom:1px solid #222"><th style="padding:16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;color:#555">Client</th><th style="padding:16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;color:#555">Véhicule</th><th style="padding:16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;color:#555">Dates</th><th style="padding:16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;color:#555">Montant</th><th style="padding:16px;text-align:left;font-size:9px;font-weight:900;text-transform:uppercase;color:#555">Statut</th></tr></thead><tbody>${rows}</tbody></table></div><div style="margin-top:40px;padding-top:24px;border-top:1px solid #1a1a1a;display:flex;justify-content:space-between"><div style="font-size:10px;color:#444;font-weight:700;text-transform:uppercase">Shift Luxury · ${today}</div><div style="font-size:10px;color:#444;font-weight:700;text-transform:uppercase">CA : <span style="color:#D4AF37">${totalRevenue.toLocaleString('fr-FR')} €</span></div></div><script>window.onload=()=>window.print();</script></body></html>`;
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};

export default function ReservationsView() {
  const [filter, setFilter] = useState('all');
  const [reservations, setReservations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [releasingId, setReleasingId] = useState(null);
  const [contractRes, setContractRes] = useState(null);
  const [checklistRes, setChecklistRes] = useState(null);
  const [checklistType, setChecklistType] = useState('checkin');
  const [checkoutRes, setCheckoutRes] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [agencyName, setAgencyName] = useState('');

  useEffect(() => { loadReservations(); loadAgencyName(); }, []);

  const loadAgencyName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('store_settings').select('shop_name').eq('user_id', user.id).maybeSingle();
      if (data?.shop_name) setAgencyName(data.shop_name);
    } catch (_) {}
  };

  const loadReservations = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data, error } = await supabase.from('bookings').select('*, fleet(model, image, price)').eq('merchant_id', user.id).order('created_at', { ascending: false });
      if (error) throw error;
      setReservations(data || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    setTimeout(() => { generatePDF(filtered, filter, agencyName); setIsExporting(false); }, 300);
  };

  const updateStatus = async (id, status, extraData = {}) => {
    try {
      const { error } = await supabase.from('bookings').update({ status, ...extraData, updated_at: new Date() }).eq('id', id);
      if (error) throw error;
      await loadReservations();
    } catch (err) { alert('Erreur : ' + err.message); }
  };

  const handleReleaseDeposit = async (res) => {
    if (!window.confirm(`Libérer la caution de ${res.deposit_amount?.toLocaleString('fr-FR') || 1500} € pour ${res.client_name} ?`)) return;
    setReleasingId(res.id);
    try {
      await supabase.from('bookings').update({ deposit_status: 'released', updated_at: new Date() }).eq('id', res.id);
      await loadReservations();
    } catch (err) { alert('Erreur : ' + err.message); }
    finally { setReleasingId(null); }
  };

  // ── Signature contrat + sauvegarde URL PDF ──
  const handleSignContract = async (sig, contractUrl) => {
    await updateStatus(contractRes.id, 'signed', {
      contract_signature: sig,
      signed_at: new Date(),
      contract_url: contractUrl || null,
    });
    setContractRes(null);
  };

  const handleChecklistComplete = async (data) => {
    await updateStatus(checklistRes.id, 'in_progress', { checkin_data: data, check_in_date: new Date() });
    setChecklistRes(null);
  };

  const handleCheckoutComplete = async (data) => {
    await updateStatus(checkoutRes.id, 'completed', { checkout_data: data, completed_at: new Date() });
    if (checkoutRes.vehicle_id) await supabase.from('fleet').update({ status: 'available' }).eq('id', checkoutRes.vehicle_id);
    setCheckoutRes(null);
  };

  const adaptForModal = (res) => ({
    ...res,
    vehicle: res.fleet?.model || res.vehicle_model || 'Véhicule',
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
  const totalFiltered = filtered.filter(r => ['completed','in_progress','signed','confirmed'].includes(r.status)).reduce((sum, r) => sum + (r.total_price || 0), 0);

  const renderActions = (res) => {
    const depositPaid = res.deposit_status === 'processing' || res.deposit_status === 'paid';
    const depositReleased = res.deposit_status === 'released';

    return (
      <div className="flex items-center gap-2 flex-wrap justify-end">
        {depositPaid && !depositReleased && (
          <button onClick={() => handleReleaseDeposit(res)} disabled={releasingId === res.id}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/20 transition-all disabled:opacity-50">
            {releasingId === res.id ? <Loader2 size={12} className="animate-spin" /> : <Unlock size={12} />}
            Libérer caution
          </button>
        )}
        {depositReleased && (
          <span className="flex items-center gap-1.5 px-3 py-2 bg-zinc-800 text-zinc-500 rounded-xl text-[9px] font-black uppercase">
            <CheckCircle size={12} className="text-emerald-500" /> Caution libérée
          </span>
        )}
        {res.status === 'pending' && (
          <div className="flex gap-2">
            <button onClick={() => updateStatus(res.id, 'confirmed')} className="px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-emerald-500/20 transition-all">✓ Confirmer</button>
            <button onClick={() => updateStatus(res.id, 'cancelled')} className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/20 rounded-xl text-[9px] font-black uppercase hover:bg-red-500/20 transition-all">✕ Refuser</button>
          </div>
        )}
        {res.status === 'confirmed' && (
          <button onClick={() => setContractRes(adaptForModal(res))} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            <PenTool size={14} /> Contrat
          </button>
        )}
        {res.status === 'signed' && (
          <button onClick={() => { setChecklistRes(adaptForModal(res)); setChecklistType('checkin'); }}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            <ShieldCheck size={14} /> État des lieux
          </button>
        )}
        {res.status === 'in_progress' && (
          <button onClick={() => setCheckoutRes(adaptForModal(res))} className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all">
            <Flag size={14} /> Retour
          </button>
        )}
        {res.status === 'completed' && !depositPaid && (
          <div className="flex items-center gap-2 text-zinc-500"><CheckCircle size={14} className="text-emerald-500" /><span className="text-[9px] font-black uppercase">Clôturé</span></div>
        )}
      </div>
    );
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
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {reservations.length} réservation{reservations.length > 1 ? 's' : ''}
            {totalFiltered > 0 && <span className="ml-3 text-[#D4AF37]">· {totalFiltered.toLocaleString('fr-FR')} € CA</span>}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button onClick={handleExportPDF} disabled={isExporting || filtered.length === 0}
            className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-40">
            {isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
            {isExporting ? 'Génération...' : `Exporter PDF (${filtered.length})`}
          </button>
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
                      <button onClick={() => setSelectedClient(res)} className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left">
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
                        <span className="text-sm text-zinc-300">{res.fleet?.model || res.vehicle_model || '—'}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs text-zinc-400 font-bold">
                        {res.start_date ? new Date(res.start_date).toLocaleDateString('fr-FR') : '—'}
                        {res.end_date ? ` → ${new Date(res.end_date).toLocaleDateString('fr-FR')}` : ''}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div>
                        <span className="text-sm font-black" style={{ color: GOLD }}>{res.total_price ? `${res.total_price.toLocaleString('fr-FR')} €` : '—'}</span>
                        {(res.deposit_status === 'processing' || res.deposit_status === 'paid') && (
                          <div className="flex items-center gap-1 mt-1">
                            <CreditCard size={10} className="text-emerald-400" />
                            <span className="text-[9px] text-emerald-400 font-bold uppercase">Caution payée</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="space-y-1">
                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${s.bg} ${s.text} ${s.border}`}>
                          <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${s.dot}`} />
                          {s.label}
                        </span>
                        {res.contract_url && (
                          <a href={res.contract_url} target="_blank" rel="noreferrer"
                            className="flex items-center gap-1 text-[9px] text-zinc-500 hover:text-[#D4AF37] transition-colors">
                            <Download size={10} /> Contrat PDF
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center justify-end">{renderActions(res)}</div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {totalFiltered > 0 && (
            <div className="border-t border-white/5 px-8 py-5 flex items-center justify-between bg-zinc-950/30">
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{filtered.length} réservation{filtered.length > 1 ? 's' : ''} affichée{filtered.length > 1 ? 's' : ''}</span>
              <span className="text-sm font-black" style={{ color: GOLD }}>Total : {totalFiltered.toLocaleString('fr-FR')} €</span>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {contractRes && <ContractModal reservation={contractRes} onClose={() => setContractRes(null)} onSign={handleSignContract} />}
        {checklistRes && <ChecklistModal reservation={checklistRes} type={checklistType} onClose={() => setChecklistRes(null)} onComplete={handleChecklistComplete} />}
        {checkoutRes && <CheckoutModal reservation={checkoutRes} onClose={() => setCheckoutRes(null)} onComplete={handleCheckoutComplete} />}
        {selectedClient && <ClientModal reservation={selectedClient} onClose={() => setSelectedClient(null)} />}
      </AnimatePresence>
    </motion.div>
  );
}

