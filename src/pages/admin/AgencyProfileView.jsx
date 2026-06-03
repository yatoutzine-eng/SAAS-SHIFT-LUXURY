import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import {
  Save, Loader2, MapPin, Check, Building2, Phone,
  Mail, Clock, Globe, Image, FileText, Star
} from 'lucide-react';

const GOLD = "#D4AF37";

const Field = ({ label, hint, children }) => (
  <div>
    <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-2">{label}</label>
    {hint && <p className="text-[9px] text-zinc-600 font-bold uppercase mb-3">{hint}</p>}
    {children}
  </div>
);

const Input = ({ icon: Icon, ...props }) => (
  <div className="relative">
    {Icon && <Icon size={15} className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-500" />}
    <input
      className={`w-full bg-black border border-white/10 py-4 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors ${Icon ? 'pl-12 pr-5' : 'px-5'}`}
      {...props}
    />
  </div>
);

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

const defaultHours = DAYS.reduce((acc, day) => ({
  ...acc,
  [day]: { open: '09:00', close: '19:00', closed: day === 'Dimanche' }
}), {});

export default function AgencyProfileView() {
  const [profile, setProfile] = useState({
    agency_name: '',
    tagline: '',
    description: '',
    email: '',
    phone: '',
    whatsapp: '',
    website: '',
    address: '',
    city: '',
    country: 'France',
    logo_url: '',
    cover_url: '',
    hours: defaultHours,
    languages: [],
    rating: 5.0,
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const logoRef = useRef();
  const coverRef = useRef();

  useEffect(() => { loadProfile(); }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('agency_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (data) {
        setProfile(prev => ({
          ...prev,
          ...data,
          hours: data.hours || defaultHours,
          languages: data.languages || [],
        }));
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { error } = await supabase.from('agency_profiles').upsert({
        user_id: user.id,
        ...profile,
        updated_at: new Date(),
      }, { onConflict: 'user_id' });
      if (error) throw error;
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erreur lors de la sauvegarde : ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const uploadImage = async (file, type) => {
    const setter = type === 'logo' ? setUploadingLogo : setUploadingCover;
    setter(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const ext = file.name.split('.').pop();
      const path = `agency/${user.id}/${type}_${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from('vehicle-images').upload(path, file, { upsert: true });
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from('vehicle-images').getPublicUrl(path);
      setProfile(prev => ({ ...prev, [`${type}_url`]: publicUrl }));
    } catch (err) {
      console.error(err);
      alert('Erreur upload : ' + err.message);
    } finally {
      setter(false);
    }
  };

  const toggleDay = (day) => {
    setProfile(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], closed: !prev.hours[day].closed } }
    }));
  };

  const setHour = (day, field, value) => {
    setProfile(prev => ({
      ...prev,
      hours: { ...prev.hours, [day]: { ...prev.hours[day], [field]: value } }
    }));
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="text-[#D4AF37] font-black tracking-[0.2em] animate-pulse uppercase">Chargement...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 text-white">

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2">
            Profil <span style={{ color: GOLD }}>Agence</span>
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Informations visibles par vos clients
          </p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-3 px-8 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all disabled:opacity-50">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Sauvegarder
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center gap-2">
          <Check size={14} /> Profil enregistré avec succès !
        </div>
      )}

      {/* ── Identité visuelle ── */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Image size={16} style={{ color: GOLD }} />
          </div>
          <h3 className="text-base font-black uppercase tracking-tighter">Identité Visuelle</h3>
        </div>

        {/* Logo + Cover */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo */}
          <div>
            <Field label="Logo de l'agence">
              <div
                onClick={() => logoRef.current?.click()}
                className="relative h-32 bg-black border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37]/40 transition-all overflow-hidden group"
              >
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="logo" className="w-full h-full object-contain p-4" />
                ) : (
                  <>
                    <Image size={24} className="text-zinc-700 mb-2" />
                    <p className="text-[9px] font-black uppercase text-zinc-600">Cliquez pour uploader</p>
                  </>
                )}
                {uploadingLogo && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'logo')} />
            </Field>
          </div>

          {/* Cover */}
          <div>
            <Field label="Photo de couverture">
              <div
                onClick={() => coverRef.current?.click()}
                className="relative h-32 bg-black border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#D4AF37]/40 transition-all overflow-hidden group"
              >
                {profile.cover_url ? (
                  <img src={profile.cover_url} alt="cover" className="w-full h-full object-cover" />
                ) : (
                  <>
                    <Image size={24} className="text-zinc-700 mb-2" />
                    <p className="text-[9px] font-black uppercase text-zinc-600">Cliquez pour uploader</p>
                  </>
                )}
                {uploadingCover && (
                  <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
                  </div>
                )}
                <div className="absolute inset-0 bg-[#D4AF37]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              <input ref={coverRef} type="file" accept="image/*" className="hidden"
                onChange={e => e.target.files[0] && uploadImage(e.target.files[0], 'cover')} />
            </Field>
          </div>
        </div>

        {/* Nom + tagline */}
        <Field label="Nom de l'agence">
          <Input icon={Building2} placeholder="Ex: Shift Paris Prestige"
            value={profile.agency_name} onChange={e => setProfile({ ...profile, agency_name: e.target.value })} />
        </Field>
        <Field label="Accroche" hint="Phrase courte affichée sous le nom sur le showroom">
          <Input placeholder="Ex: La location de luxe sans compromis"
            value={profile.tagline} onChange={e => setProfile({ ...profile, tagline: e.target.value })} />
        </Field>
        <Field label="Description" hint="Présentation complète de votre agence">
          <textarea
            rows={4}
            className="w-full bg-black border border-white/10 px-5 py-4 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors resize-none"
            placeholder="Parlez de votre agence, votre expertise, vos valeurs..."
            value={profile.description}
            onChange={e => setProfile({ ...profile, description: e.target.value })}
          />
        </Field>
      </div>

      {/* ── Contact ── */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Phone size={16} style={{ color: GOLD }} />
          </div>
          <h3 className="text-base font-black uppercase tracking-tighter">Contact</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <Field label="Email">
            <Input icon={Mail} type="email" placeholder="contact@monagence.fr"
              value={profile.email} onChange={e => setProfile({ ...profile, email: e.target.value })} />
          </Field>
          <Field label="Téléphone">
            <Input icon={Phone} placeholder="+33 1 00 00 00 00"
              value={profile.phone} onChange={e => setProfile({ ...profile, phone: e.target.value })} />
          </Field>
          <Field label="WhatsApp">
            <Input placeholder="+33 6 00 00 00 00"
              value={profile.whatsapp} onChange={e => setProfile({ ...profile, whatsapp: e.target.value })} />
          </Field>
          <Field label="Site web">
            <Input icon={Globe} placeholder="https://monagence.fr"
              value={profile.website} onChange={e => setProfile({ ...profile, website: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* ── Adresse ── */}
      <div className="bg-zinc-900/40 border border-[#D4AF37]/20 rounded-[2rem] p-8 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <MapPin size={16} style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-base font-black uppercase tracking-tighter">Adresse</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">Apparaît sur la map mondiale</p>
          </div>
        </div>
        <Field label="Rue">
          <Input placeholder="Ex: 12 Avenue Montaigne"
            value={profile.address} onChange={e => setProfile({ ...profile, address: e.target.value })} />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Ville">
            <Input placeholder="Ex: Paris"
              value={profile.city} onChange={e => setProfile({ ...profile, city: e.target.value })} />
          </Field>
          <Field label="Pays">
            <Input placeholder="Ex: France"
              value={profile.country} onChange={e => setProfile({ ...profile, country: e.target.value })} />
          </Field>
        </div>
      </div>

      {/* ── Horaires ── */}
      <div className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Clock size={16} style={{ color: GOLD }} />
          </div>
          <h3 className="text-base font-black uppercase tracking-tighter">Horaires d'ouverture</h3>
        </div>
        <div className="space-y-3">
          {DAYS.map(day => (
            <div key={day} className="flex items-center gap-4">
              <div className="w-24 flex-shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{day}</span>
              </div>
              <button
                onClick={() => toggleDay(day)}
                className={`w-10 h-5 rounded-full transition-all flex-shrink-0 relative ${!profile.hours[day]?.closed ? 'bg-[#D4AF37]' : 'bg-zinc-700'}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all ${!profile.hours[day]?.closed ? 'left-5' : 'left-0.5'}`} />
              </button>
              {!profile.hours[day]?.closed ? (
                <div className="flex items-center gap-2 flex-1">
                  <input type="time" value={profile.hours[day]?.open || '09:00'}
                    onChange={e => setHour(day, 'open', e.target.value)}
                    className="bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-black outline-none focus:border-[#D4AF37]/50" />
                  <span className="text-zinc-600 text-xs font-black">—</span>
                  <input type="time" value={profile.hours[day]?.close || '19:00'}
                    onChange={e => setHour(day, 'close', e.target.value)}
                    className="bg-black border border-white/10 px-3 py-2 rounded-xl text-xs font-black outline-none focus:border-[#D4AF37]/50" />
                </div>
              ) : (
                <span className="text-[10px] font-black uppercase text-zinc-600 tracking-widest">Fermé</span>
              )}
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

