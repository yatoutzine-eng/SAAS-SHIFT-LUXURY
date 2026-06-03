import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2, MapPin, Copy, Check } from 'lucide-react';

const GOLD = "#D4AF37";

export default function SettingsView() {
  const [settings, setSettings] = useState({
    store_code: 'SHIFT-' + Math.random().toString(36).toUpperCase().substring(2, 7),
    shop_name: '',
    concierge_phone: '',
    weekend_markup: 0,
    address: '',
    city: '',
    country: 'France',
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [geoStatus, setGeoStatus] = useState('');

  useEffect(() => { loadData(); }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase.from('store_settings').select('*').eq('user_id', user.id).maybeSingle();
      if (data) setSettings(prev => ({ ...prev, ...data }));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }

  // Géocodage via API publique
  const geocodeAddress = async (address, city, country) => {
    if (!city) return null;
    try {
      const query = encodeURIComponent(`${address ? address + ', ' : ''}${city}, ${country || 'France'}`);
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`, {
        headers: { 'Accept-Language': 'fr', 'User-Agent': 'ShiftLuxury/1.0' }
      });
      const geo = await res.json();
      if (geo && geo[0]) return [parseFloat(geo[0].lat), parseFloat(geo[0].lon)];
    } catch (e) { console.error('Géocodage échoué:', e); }
    return null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    setGeoStatus('');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      let coords = settings.coords || null;

      // Géocodage si adresse renseignée
      if (settings.city) {
        setGeoStatus('Géolocalisation en cours...');
        const newCoords = await geocodeAddress(settings.address, settings.city, settings.country);
        if (newCoords) {
          coords = newCoords;
          setGeoStatus('✅ Position trouvée !');
        } else {
          setGeoStatus('⚠️ Ville non trouvée, vérifiez l\'orthographe');
        }
      }

      const { error } = await supabase.from('store_settings').upsert({
        user_id: user.id,
        store_code: settings.store_code,
        shop_name: settings.shop_name,
        concierge_phone: settings.concierge_phone,
        weekend_markup: settings.weekend_markup,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        coords,
        updated_at: new Date()
      }, { onConflict: 'user_id' });

      if (error) {
        alert(error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) { console.error(err); }
    finally { setIsSaving(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(settings.store_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="text-[#D4AF37] font-black tracking-[0.2em] animate-pulse uppercase">Chargement...</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-10 space-y-8 text-white">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter">Configuration</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Identité & Stratégie</p>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="bg-white text-black px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-[#D4AF37] transition-all disabled:opacity-50">
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Sauvegarder
        </button>
      </div>

      {saved && (
        <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
          ✓ Enregistré avec succès !
        </div>
      )}

      {geoStatus && (
        <div className="p-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {geoStatus}
        </div>
      )}

      <div className="grid gap-6">

        {/* NOM */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">Nom de l'agence</label>
          <input
            className="w-full bg-black border border-white/10 p-5 rounded-2xl text-lg font-black outline-none focus:border-[#D4AF37]/50 transition-colors"
            placeholder="Ex: Shift Paris Prestige"
            value={settings.shop_name || ''}
            onChange={(e) => setSettings({ ...settings, shop_name: e.target.value })}
          />
        </div>

        {/* CODE */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">Code Boutique Unique</label>
          <div className="flex gap-3">
            <input
              className="flex-1 bg-black border border-white/10 p-5 rounded-2xl text-2xl font-black text-[#D4AF37] outline-none focus:border-[#D4AF37]/50 transition-colors"
              value={settings.store_code || ''}
              onChange={(e) => setSettings({ ...settings, store_code: e.target.value.toUpperCase() })}
            />
            <button onClick={copyCode}
              className="px-6 bg-zinc-800 border border-white/10 rounded-2xl hover:border-[#D4AF37]/50 transition-all flex items-center gap-2 text-[10px] font-black uppercase tracking-widest">
              {copied ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
              {copied ? 'Copié !' : 'Copier'}
            </button>
          </div>
          <p className="mt-3 text-zinc-600 text-[9px] font-bold uppercase">Partagez ce code à vos clients pour accéder à votre flotte.</p>
        </div>

        {/* ADRESSE */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-[#D4AF37]/20">
          <div className="flex items-center gap-3 mb-6">
            <MapPin size={18} style={{ color: GOLD }} />
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest" style={{ color: GOLD }}>
                Adresse de l'agence
              </label>
              <p className="text-[9px] text-zinc-500 font-bold uppercase mt-0.5">
                Renseignez votre adresse pour apparaître sur la map mondiale
              </p>
            </div>
          </div>
          <div className="grid gap-4">
            <input
              className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors"
              placeholder="Rue — Ex: 12 Avenue Montaigne"
              value={settings.address || ''}
              onChange={(e) => setSettings({ ...settings, address: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors"
                placeholder="Ville — Ex: Paris"
                value={settings.city || ''}
                onChange={(e) => setSettings({ ...settings, city: e.target.value })}
              />
              <input
                className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors"
                placeholder="Pays — Ex: France"
                value={settings.country || 'France'}
                onChange={(e) => setSettings({ ...settings, country: e.target.value })}
              />
            </div>
          </div>
          {settings.coords && (
            <p className="mt-3 text-emerald-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
              <Check size={12} /> Position géolocalisée — visible sur la map
            </p>
          )}
        </div>

        {/* CONCIERGE */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-4 tracking-widest">WhatsApp Conciergerie</label>
          <div className="relative">
            <input
              className="w-full bg-black border border-white/10 p-5 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors pl-14"
              placeholder="+33 6 00 00 00 00"
              value={settings.concierge_phone || ''}
              onChange={(e) => setSettings({ ...settings, concierge_phone: e.target.value })}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]">📱</div>
          </div>
        </div>

        {/* WEEKEND INFO */}
        <div className="bg-zinc-900/50 p-8 rounded-[2rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-3 tracking-widest">Tarification Weekend</label>
          <p className="text-zinc-400 text-xs font-bold">
            Le prix weekend se configure <span className="text-[#D4AF37]">véhicule par véhicule</span> dans{' '}
            <span className="text-white">"Ma Flotte" → Édition véhicule</span>.
          </p>
        </div>

      </div>
    </div>
  );
}
