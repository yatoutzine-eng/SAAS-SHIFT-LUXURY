import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { Car, User, Calendar, LogOut, FileText, Save, CheckCircle2, Upload, Loader2, Shield, Phone, Mail, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

const STATUS_STYLES = {
  'pending':     { text: 'text-amber-400',   bg: 'bg-amber-500/10',   label: 'En attente' },
  'confirmed':   { text: 'text-[#D4AF37]',   bg: 'bg-[#D4AF37]/10',   label: 'Confirmé' },
  'signed':      { text: 'text-emerald-400', bg: 'bg-emerald-500/10', label: 'Signé' },
  'in_progress': { text: 'text-blue-400',    bg: 'bg-blue-500/10',    label: 'En cours' },
  'completed':   { text: 'text-zinc-400',    bg: 'bg-zinc-800',       label: 'Terminé' },
  'cancelled':   { text: 'text-red-400',     bg: 'bg-red-500/10',     label: 'Annulé' },
};

export default function ClientAccount() {
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

      // Profil
      const { data: profileData } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (profileData) setProfile(prev => ({ ...prev, ...profileData }));

      // Réservations du client
      const { data: bk } = await supabase
        .from('bookings')
        .select('*, fleet(model, image)')
        .eq('client_email', authUser.email)
        .order('created_at', { ascending: false });
      setBookings(bk || []);

      // Documents
      const { data: files } = await supabase.storage.from('client-documents').list(authUser.id + '/');
      setDocuments(files || []);

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
    { id: 'bookings', label: 'Réservations', icon: Calendar },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'profile', label: 'Profil', icon: User },
  ];

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-black/80 backdrop-blur-xl px-6 lg:px-12 h-20 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-[#D4AF37] rounded-xl flex items-center justify-center">
            <Car size={16} className="text-black" />
          </div>
          <span className="text-lg font-black uppercase tracking-widest">Shift <span style={{ color: GOLD }}>Luxury</span></span>
        </div>

        {/* Nav tabs desktop */}
        <nav className="hidden md:flex items-center gap-1 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5">
          {tabs.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}>
              <tab.icon size={13} /> {tab.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { localStorage.removeItem('shift_viewing_store'); localStorage.removeItem('shift_selected_store'); logout(); }}
            className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl font-black uppercase text-[9px] tracking-widest hover:scale-105 transition-all"
          >
            <MapPin size={13} /> Trouver une agence
          </button>
          <button onClick={logout} className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-500 hover:text-red-500 transition-all">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* Mobile tabs */}
      <div className="md:hidden flex border-b border-white/5">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-4 text-[9px] font-black uppercase tracking-widest transition-all flex flex-col items-center gap-1 ${activeTab === tab.id ? 'text-[#D4AF37] border-b-2 border-[#D4AF37]' : 'text-zinc-500'}`}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <main className="max-w-5xl mx-auto p-6 lg:p-12">

        {/* RÉSERVATIONS */}
        {activeTab === 'bookings' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Mes <span style={{ color: GOLD }}>Réservations</span></h2>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">{bookings.length} réservation{bookings.length > 1 ? 's' : ''}</p>
            </div>

            {bookings.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                <Calendar size={40} className="mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-6">Aucune réservation pour le moment</p>
                <p className="text-zinc-600 text-xs mb-8">Entrez le code d'une boutique pour découvrir sa flotte</p>
                <button
                  onClick={() => { localStorage.removeItem('shift_viewing_store'); localStorage.removeItem('shift_selected_store'); logout(); }}
                  className="flex items-center gap-2 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all"
                >
                  <MapPin size={16} /> Trouver une agence
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {bookings.map(b => {
                  const s = STATUS_STYLES[b.status] || STATUS_STYLES['pending'];
                  return (
                    <div key={b.id} className="group bg-zinc-900/30 border border-white/5 rounded-[2rem] overflow-hidden flex flex-col md:flex-row hover:border-[#D4AF37]/20 transition-all">
                      <div className="w-full md:w-48 h-32 md:h-auto bg-zinc-900 flex-shrink-0">
                        {b.fleet?.image
                          ? <img src={b.fleet.image} className="w-full h-full object-cover" alt="" />
                          : <div className="w-full h-full flex items-center justify-center"><Car size={32} className="text-zinc-700" /></div>}
                      </div>
                      <div className="flex-1 p-6 flex flex-col justify-between">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-black uppercase tracking-tight">{b.fleet?.model || b.vehicle_model}</h3>
                            <p className="text-zinc-500 text-[10px] font-bold uppercase mt-1">
                              {b.start_date ? new Date(b.start_date).toLocaleDateString('fr-FR') : '—'}
                              {b.end_date ? ` → ${new Date(b.end_date).toLocaleDateString('fr-FR')}` : ''}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-xl font-black" style={{ color: GOLD }}>{b.total_price ? `${b.total_price.toLocaleString('fr-FR')}€` : '—'}</p>
                            <span className={`text-[9px] font-black uppercase px-3 py-1 rounded-full ${s.bg} ${s.text}`}>{s.label}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Mes <span style={{ color: GOLD }}>Documents</span></h2>
                <p className="text-zinc-500 text-xs font-bold uppercase">Permis, justificatifs, contrats</p>
              </div>
              <label className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest cursor-pointer hover:scale-105 transition-all">
                {isUploading ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
                {isUploading ? 'Upload...' : 'Ajouter'}
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={handleDocumentUpload} />
              </label>
            </div>

            {documents.length === 0 ? (
              <div className="py-24 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
                <FileText size={40} className="mx-auto mb-4 text-zinc-700" />
                <p className="text-zinc-500 font-bold uppercase text-sm mb-2">Aucun document</p>
                <p className="text-zinc-600 text-xs">Uploadez votre permis de conduire et vos justificatifs</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {documents.map((doc, i) => (
                  <div key={i} className="bg-zinc-900/30 border border-white/5 p-6 rounded-[2rem] hover:border-[#D4AF37]/20 transition-all">
                    <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center mb-4">
                      <FileText size={18} style={{ color: GOLD }} />
                    </div>
                    <h3 className="font-black uppercase text-sm truncate mb-1">{doc.name}</h3>
                    <p className="text-[9px] font-bold text-zinc-500 uppercase">{doc.metadata?.size ? `${Math.round(doc.metadata.size / 1024)} KB` : ''}</p>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* PROFIL */}
        {activeTab === 'profile' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 max-w-2xl">
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Mon <span style={{ color: GOLD }}>Profil</span></h2>
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
                { key: 'full_name', label: 'Nom complet', icon: User, type: 'text' },
                { key: 'phone', label: 'Téléphone', icon: Phone, type: 'tel' },
                { key: 'address', label: 'Adresse', icon: MapPin, type: 'text' },
                { key: 'license_number', label: 'N° Permis de conduire', icon: Shield, type: 'text' },
              ].map(({ key, label, icon: Icon, type }) => (
                <div key={key} className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">{label}</label>
                  <div className="relative">
                    <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input type={type} value={profile[key] || ''}
                      onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                      className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all" />
                  </div>
                </div>
              ))}

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-zinc-500 ml-2">Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input type="email" value={user?.email || ''} disabled
                    className="w-full bg-zinc-900/30 border border-white/5 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold text-zinc-500 cursor-not-allowed" />
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
      </main>
    </div>
  );
}
