import React, { useState } from 'react';
import { Phone, MapPin, Check, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function CustomerProfile() {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState({ phone: '', address: '' });

  const handleSave = async () => {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    await supabase.from('profiles').upsert({ id: session.user?.id, ...profile });
    setLoading(false);
  };

  return (
    <div className="p-8 bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] space-y-6">
      <input type="tel" placeholder="Téléphone" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white" value={profile.phone} onChange={e => setProfile({...profile, phone: e.target.value})} />
      <input type="text" placeholder="Adresse" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-white" value={profile.address} onChange={e => setProfile({...profile, address: e.target.value})} />
      <button onClick={handleSave} className="w-full bg-white text-black py-6 rounded-[2rem] font-black uppercase text-[10px] tracking-widest hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all flex items-center justify-center gap-2">
        {loading ? <Loader2 className="animate-spin" /> : <Check size={18} />}
        CONFIRMER LES MODIFICATIONS
      </button>
    </div>
  );
}
