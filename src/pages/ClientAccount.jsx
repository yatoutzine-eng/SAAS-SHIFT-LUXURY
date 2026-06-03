import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import {
  Car, User, Calendar, LogOut, FileText, Save,
  CheckCircle2, Upload, Loader2, Shield, Phone,
  Mail, MapPin, Clock, ChevronDown, ChevronUp,
  Download, ArrowRight, Star, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

const STATUS_CONFIG = {
  pending:     { label: 'En attente',  text: 'text-amber-400',   bg: 'bg-amber-500/10',   border: 'border-amber-500/20',   step: 0 },
  confirmed:   { label: 'Confirmé',    text: 'text-[#D4AF37]',   bg: 'bg-[#D4AF37]/10',   border: 'border-[#D4AF37]/20',   step: 1 },
  signed:      { label: 'Signé',       text: 'text-purple-400',  bg: 'bg-purple-500/10',  border: 'border-purple-500/20',  step: 2 },
  in_progress: { label: 'En cours',    text: 'text-blue-400',    bg: 'bg-blue-500/10',    border: 'border-blue-500/20',    step: 3 },
  completed:   { label: 'Terminé',     text: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', step: 4 },
  cancelled:   { label: 'Annulé',      text: 'text-red-400',     bg: 'bg-red-500/10',     border: 'border-red-500/20',     step: -1 },
};

const STEPS = ['En attente', 'Confirmé', 'Signé', 'En cours', 'Terminé'];

// ── Timeline de statut ──────────────────────────────────────────────────────
const StatusTimeline = ({ status }) => {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  if (status === 'cancelled') return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
      <AlertCircle size={12} className="text-red-400" />
      <span className="text-[10px] font-black uppercase text-red-400">Annulée</span>
    </div>
  );
  return (
    <div className="flex items-center gap-1 mt-4">
      {STEPS.map((step, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
              i < config.step ? 'bg-[#D4AF37] border-[#D4AF37]' :
              i === config.step ? `border-[#D4AF37] bg-[#D4AF37]/20` :
              'border-zinc-700 bg-transparent'
            }`}>
              {i < config.step && <CheckCircle2 size={12} className="text-black" />}
              {i === config.step && <div className="w-2 h-2 rounded-full bg-[#D4AF37]" />}
            </div>
            <span className={`text-[7px] font-black uppercase hidden md:block ${i <= config.step ? 'text-zinc-400' : 'text-zinc-700'}`}>
              {step}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div className={`flex-1 h-0.5 mb-4 transition-all ${i < config.step ? 'bg-[#D4AF37]' : 'bg-zinc-800'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

// ── Carte réservation ───────────────────────────────────────────────────────
const BookingCard = ({ b }) => {
  const [expanded, setExpanded] = useState(false);
  const s = STATUS_CONFIG[b.status] || STATUS_CONFIG.pending;

  const nights = b.start_date && b.end_date
    ? Math.max(1, Math.round((new Date(b.end_date) - new Date(b.start_date)) / 86400000))
    : null;

  const downloadContract = () => {
    if (!b.contract_url) return alert('Contrat non disponible pour le moment.');
    window.open(b.contract_url, '_blank');
  };

  return (
    <motion.div
      layout
      className={`bg-zinc-900/30 border rounded-[2rem] overflow-hidden transition-all ${expanded ? 'border-[#D4AF37]/30' : 'border-white/5 hover:border-white/10'}`}
    >
      {/* Ligne principale */}
      <button className="w-full text-left" onClick={() => setExpanded(!expanded)}>
        <div className="flex flex-col md:flex-row">
          {/* Image */}
          <div className="w-full md:w-44 h-36 md:h-auto bg-zinc-900 flex-shrink-0">
            {b.fleet?.image
              ? <img src={b.fleet.image} className="w-full h-full object-cover" alt="" />
              : <div className="w-full h-full flex items-center justify-center"><Car size={28} className="text-zinc-700" /></div>
            }
          </div>

          {/* Infos */}
          <div className="flex-1 p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-black uppercase tracking-tight leading-none mb-1">
                  {b.fleet?.model || b.vehicle_model || 'Véhicule'}
                </h3>
                <div className="flex items-center gap-2 text-zinc-500 text-[10px] font-bold uppercase">
                  <Clock size={10} />
                  {b.start_date ? new Date(b.start_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  <ArrowRight size={10} />
                  {b.end_date ? new Date(b.end_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                  {nights && <span className="text-zinc-600">· {nights} nuit{nights > 1 ? 's' : ''}</span>}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-xl font-black tracking-tighter" style={{ color: GOLD }}>
                  {b.total_price ? `${b.total_price.toLocaleString('fr-FR')} €` : '—'}
                </p>
                <span className={`inline-block text-[9px] font-black uppercase px-3 py-1 rounded-full mt-1 border ${s.bg} ${s.text} ${s.border}`}>
                  {s.label}
                </span>
              </div>
            </div>

            {/* Timeline */}
            <StatusTimeline status={b.status} />
          </div>

          {/* Expand icon */}
          <div className="hidden md:flex items-center px-6">
            {expanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
          </div>
        </div>
      </button>

      {/* Détails expandés */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-white/5 pt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Détails location */}
              <div className="bg-black/30 rounded-2xl p-4 space-y-3">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3">Détails</p>
                {[
                  { label: 'Référence', value: b.id?.slice(0, 8).toUpperCase() },
                  { label: 'Lieu de prise en charge', value: b.pickup_location || 'À définir' },
                  { label: 'Lieu de restitution', value: b.return_location || 'À définir' },
                  { label: 'Durée', value: nights ? `${nights} nuit${nights > 1 ? 's' : ''}` : '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-bold uppercase text-zinc-600">{label}</span>
                    <span className="text-[10px] font-black text-right">{value}</span>
                  </div>
                ))}
              </div>

              {/* Prix */}
              <div className="bg-black/30 rounded-2xl p-4 space-y-3">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-3">Récapitulatif</p>
                {[
                  { label: 'Prix / nuit', value: nights && b.total_price ? `${Math.round(b.total_price / nights).toLocaleString('fr-FR')} €` : '—' },
                  { label: `${nights || 0} nuit${nights > 1 ? 's' : ''}`, value: b.total_price ? `${b.total_price.toLocaleString('fr-FR')} €` : '—' },
                  { label: 'Caution', value: b.deposit ? `${b.deposit.toLocaleString('fr-FR')} €` : 'Non renseignée' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between items-center">
                    <span className="text-[9px] font-bold uppercase text-zinc-600">{label}</span>
                    <span className="text-[10px] font-black">{value}</span>
                  </div>
                ))}
                <div className="border-t border-white/10 pt-2 flex justify-between items-center">
                  <span className="text-[9px] font-black uppercase text-zinc-400">Total</span>
                  <span className="text-base font-black" style={{ color: GOLD }}>
                    {b.total_price ? `${b.total_price.toLocaleString('fr-FR')} €` : '—'}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="bg-black/30 rounded-2xl p-4 flex flex-col gap-3">
                <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Actions</p>
                <button
                  onClick={downloadContract}
                  disabled={!b.contract_url && b.status !== 'signed' && b.status !== 'in_progress' && b.status !== 'completed'}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-[#D4AF37] text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100"
                >
                  <Download size={13} /> Télécharger le contrat
                </button>
                {b.status === 'pending' && (
                  <div className="flex items-center gap-2 p-3 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <AlertCircle size={12} className="text-amber-400 flex-shrink-0" />
                    <p className="text-[9px] text-amber-400 font-bold uppercase">En attente de confirmation par l'agence</p>
                  </div>
                )}
                {b.status === 'completed' && (
                  <div className="flex items-center gap-2 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl">
                    <Star size={12} className="text-emerald-400 flex-shrink-0" />
                    <p className="text-[9px] text-emerald-400 font-bold uppercase">Location terminée</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ── COMPOSANT PRINCIPAL ─────────────────────────────────────────────────────
export default function ClientAccount({ onBack }) {
  const { logout, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('bookings');
  const [isLoading, setIsLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState({ full_name: '', phone: '', address: '', license_number: '' });
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (profileData) setProfile(prev => ({ ...prev, ...profileData }));

      const { data: bk } = await supabase
        .from('bookings')
        .select('*, fleet(model, image)')
        .eq('client_email', authUser.email)
        .order('created_at', { ascending: false });
      setBookings(bk || []);

      try {
        const { data: files } = await supabase.storage.from('client-documents').list(authUser.id + '/');
        setDocuments(files || []);
      } catch (_) {}
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      await supabase.from('profiles').upsert({ id: authUser.id, ...profile, updated_at: new Date() });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const handleDocumentUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const path = `${authUser.id}/${Date.now()}_${file.name}`;
      const { error } = await supabase.storage.from('client-documents').upload(path, file);
      if (error) throw error;
      await loadData();
    } catch (err) { alert('Erreur upload : ' + err.message); }
    finally { setIsUploading(false); }
  };

  if (isLoading) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'bookings', label: 'Réservations', icon: Calendar, count: bookings.filter(b => ['pending','confirmed','in_progress'].includes(b.status)).length },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'profile', label: 'Mon Profil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-black text-white">

      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl px-6 lg:px-12 h-20 flex items-center justify-between sticky top-0 z-50">
        <button onClick={onBack} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-9 h-9 bg-[#D4AF37] rounded-xl flex items-center justify-center">
            <Car size={16} className="text-black" />
          </div>
          <span className="text-lg font-black uppercase tracking-widest">
            Shift <span style={{ color: GOLD }}>Luxury</span>
          </span>
        </button>

        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 relative ${activeTab === tab.id ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
              <tab.icon size={13} />
              {tab.label}
              {tab.count > 0 && (
                <span className={`text-[8px] font-black px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-black/20 text-black' : 'bg-[#D4AF37] text-black'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>

        <button onClick={logout} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all" title="Se déconnecter">
          <LogOut size={16} />
        </button>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-white/5 bg-black sticky top-20 z-40">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 relative ${activeTab === tab.id ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-zinc-500'}`}>
            <tab.icon size={16} />
            {tab.label}
            {tab.count > 0 && (
              <span className="absolute top-2 right-4 w-4 h-4 bg-[#D4AF37] text-black text-[8px] font-black rounded-full flex items-center justify-center">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-6 lg:p-12">
        <AnimatePresence mode="wait">

          {/* ── RÉSERVATIONS ── */}
          {activeTab === 'bookings' && (
            <motion.div key="bookings" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                  Mes <span style={{ color: GOLD }}>Réservations</span>
                </h2>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  {bookings.length} réservation{bookings.length > 1 ? 's' : ''}
                  {bookings.filter(b => b.status === 'pending').length > 0 && (
                    <span className="ml-3 text-amber-400">· {bookings.filter(b => b.status === 'pending').length} en attente</span>
                  )}
                </p>
              </div>

              {bookings.length === 0 ? (
                <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                  <Calendar size={40} className="mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">Aucune réservation</p>
                  <p className="text-zinc-600 text-xs mb-8">Entrez le code d'une agence pour découvrir sa flotte</p>
                  <button onClick={onBack}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
                    <MapPin size={14} /> Trouver une agence
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              )}
            </motion.div>
          )}

          {/* ── DOCUMENTS ── */}
          {activeTab === 'documents' && (
            <motion.div key="docs" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">
              <div className="flex items-end justify-between">
                <div>
                  <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                    Mes <span style={{ color: GOLD }}>Documents</span>
                  </h2>
                  <p className="text-zinc-500 text-xs font-bold uppercase">Permis, justificatifs, contrats</p>
                </div>
                <label className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:scale-105 transition-all">
                  {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                  {isUploading ? 'Upload...' : 'Ajouter'}
                  <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDocumentUpload} />
                </label>
              </div>

              <div className="bg-zinc-900/30 border border-[#D4AF37]/20 rounded-[2rem] p-6">
                <p className="text-[10px] font-black uppercase text-zinc-500 mb-3 tracking-widest">Documents recommandés</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['Permis de conduire (recto)', 'Permis de conduire (verso)', "Pièce d'identité"].map(doc => (
                    <div key={doc} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-white/5">
                      <div className="w-8 h-8 rounded-lg bg-[#D4AF37]/10 flex items-center justify-center flex-shrink-0">
                        <FileText size={14} style={{ color: GOLD }} />
                      </div>
                      <span className="text-[10px] font-bold uppercase text-zinc-400">{doc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="py-16 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                  <FileText size={36} className="mx-auto mb-4 text-zinc-700" />
                  <p className="text-zinc-500 font-bold uppercase text-sm mb-1">Aucun document uploadé</p>
                  <p className="text-zinc-600 text-xs">Ajoutez votre permis pour accélérer la validation</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {documents.map((doc, i) => (
                    <div key={i} className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] hover:border-[#D4AF37]/20 transition-all">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
                        <FileText size={18} style={{ color: GOLD }} />
                      </div>
                      <h3 className="font-black uppercase text-sm truncate mb-1">{doc.name}</h3>
                      <p className="text-[9px] font-bold text-zinc-500 uppercase">
                        {doc.metadata?.size ? `${Math.round(doc.metadata.size / 1024)} KB` : ''}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ── PROFIL ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8 max-w-2xl">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">
                  Mon <span style={{ color: GOLD }}>Profil</span>
                </h2>
                <p className="text-zinc-500 text-xs font-bold uppercase">{user?.email}</p>
              </div>

              {saved && (
                <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Profil mis à jour !</span>
                </div>
              )}

              <div className="space-y-4">
                {[
                  { key: 'full_name', label: 'Nom complet', icon: User, type: 'text', placeholder: 'Jean Dupont' },
                  { key: 'phone', label: 'Téléphone', icon: Phone, type: 'tel', placeholder: '+33 6 00 00 00 00' },
                  { key: 'address', label: 'Adresse', icon: MapPin, type: 'text', placeholder: '12 rue de la Paix, Paris' },
                  { key: 'license_number', label: 'N° Permis de conduire', icon: Shield, type: 'text', placeholder: 'XX-000000-XX' },
                ].map(({ key, label, icon: Icon, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block">{label}</label>
                    <div className="relative">
                      <Icon size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input type={type} value={profile[key] || ''} placeholder={placeholder}
                        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                        className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all" />
                    </div>
                  </div>
                ))}

                <div>
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-1 mb-2 block">Email</label>
                  <div className="relative">
                    <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type="email" value={user?.email || ''} disabled
                      className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl py-4 pl-11 pr-5 text-sm font-bold text-zinc-500 cursor-not-allowed" />
                  </div>
                </div>

                <button onClick={handleSaveProfile} disabled={isSaving}
                  className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:scale-[1.02] transition-all disabled:opacity-50 mt-4">
                  {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                  {isSaving ? 'Sauvegarde...' : 'Mettre à jour mon profil'}
                </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>
    </div>
  );
}

