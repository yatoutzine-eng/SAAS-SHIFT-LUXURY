import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Save, Loader2 } from 'lucide-react';

export default function SettingsView() {
  const [settings, setSettings] = useState({
    store_code: 'SHIFT-' + Math.random().toString(36).toUpperCase().substring(2, 7),
    shop_name: '',
    concierge_phone: '',
    weekend_markup: 0
  });
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // GOD MODE ID - Bypasses Auth block in development
  const DEV_UUID = '062c0db0-ca23-4149-aef0-340bed976f31';

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || DEV_UUID; // Repli stratégique sur le DEV_UUID

      const { data } = await supabase
        .from('store_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) setSettings(data);
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  }

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const userId = user?.id || DEV_UUID; // Repli stratégique sur le DEV_UUID

      const { error } = await supabase.from('store_settings').upsert({ 
        user_id: userId, ...settings, updated_at: new Date() 
      }, { onConflict: 'user_id' });
      
      if (error) {
        alert(error.message);
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000); // Disparaît après 3 secondes (Luxe)
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) return (
    <div className="h-[60vh] flex items-center justify-center">
      <div className="text-[#D4AF37] font-black tracking-[0.2em] animate-pulse uppercase italic">
        Chargement des paramètres...
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto p-10 space-y-10 text-white">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black uppercase italic tracking-tighter">Configuration</h2>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">Identité & Stratégie</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="bg-white text-black px-10 py-5 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center gap-3 hover:bg-[#D4AF37] transition-all disabled:opacity-50"
        >
          {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          Sauvegarder
        </button>
      </div>

      {saved && (
        <div className="p-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 transition-all">
          ✓ Enregistré avec succès
        </div>
      )}

      <div className="grid gap-8">
        {/* STORE CODE */}
        <div className="bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest">Code Boutique Unique</label>
          <div className="flex gap-4">
            <input 
              className="flex-1 bg-black border border-white/10 p-6 rounded-2xl text-2xl font-black text-[#D4AF37] outline-none focus:border-[#D4AF37]/50 transition-colors"
              value={settings.store_code}
              onChange={(e) => setSettings({...settings, store_code: e.target.value.toUpperCase()})}
            />
          </div>
          <p className="mt-4 text-zinc-600 text-[9px] font-bold uppercase">Ce code permet à vos clients d'accéder à votre flotte dédiée.</p>
        </div>

        {/* WEEKEND MARKUP */}
        <div className="bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5">
          <div className="flex justify-between items-center mb-8">
            <label className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Tarification Weekend</label>
            <span className="text-[#D4AF37] font-black text-xl">+{settings.weekend_markup}%</span>
          </div>
          <input 
            type="range" min="0" max="100"
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4AF37]"
            value={settings.weekend_markup}
            onChange={(e) => setSettings({...settings, weekend_markup: e.target.value})}
          />
          <div className="flex justify-between mt-4 text-[9px] font-bold text-zinc-600 uppercase">
            <span>Standard</span>
            <span>Premium (+100%)</span>
          </div>
        </div>

        {/* CONCIERGE */}
        <div className="bg-zinc-900/50 p-10 rounded-[2.5rem] border border-white/5">
          <label className="block text-[10px] font-black text-zinc-500 uppercase mb-6 tracking-widest">WhatsApp Conciergerie</label>
          <div className="relative">
            <input 
              className="w-full bg-black border border-white/10 p-6 rounded-2xl text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-colors pl-14"
              placeholder="+33 6 00 00 00 00"
              value={settings.concierge_phone}
              onChange={(e) => setSettings({...settings, concierge_phone: e.target.value})}
            />
            <div className="absolute left-6 top-1/2 -translate-y-1/2 text-[#D4AF37]">
              📱
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
