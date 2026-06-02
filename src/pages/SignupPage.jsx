import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  User, Mail, Key, Store, Users, Loader2, 
  AlertCircle, ArrowRight, PartyPopper, CheckCircle2
} from 'lucide-react';

export default function SignupPage() {
  const navigate = useNavigate();
  const [role, setRole] = useState('vendor'); // Par défaut Commerçant
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const generateStoreCode = (name) => {
    const base = name.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `${base}-${random}`;
  };

  async function handleSignup(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');
    const fullName = formData.get('fullName');
    
    // Génération du store_code uniquement pour les vendeurs
    const storeCode = role === 'vendor' ? generateStoreCode(fullName) : null;

    const { data, error: signupError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          role: role, // 'customer' ou 'vendor'
          store_code: storeCode
        }
      }
    });

    if (signupError) {
      setError(signupError.message);
      setLoading(false);
      return;
    }

    // Si c'est un vendeur, on initialise ses paramètres de boutique
    if (role === 'vendor' && data.user) {
      await supabase.from('store_settings').insert([{
        store_code: storeCode,
        shop_name: `${fullName} Rentals`,
        opening_hours: {
          monday: '09:00 - 18:00',
          tuesday: '09:00 - 18:00',
          wednesday: '09:00 - 18:00',
          thursday: '09:00 - 18:00',
          friday: '09:00 - 18:00',
          saturday: '10:00 - 16:00',
          sunday: 'Fermé'
        }
      }]);
    }

    setSuccess(true);
    
    // Redirection intelligente après 2 secondes
    setTimeout(() => {
      if (role === 'vendor') {
        window.location.assign('/admin');
      } else {
        window.location.assign('/');
      }
    }, 2000);
  }

  if (success) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
        <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
          <div className="w-24 h-24 bg-emerald-500/20 border border-emerald-500/30 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8">
            <PartyPopper size={48} className="text-emerald-500" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100">Bienvenue !</h1>
          <p className="text-zinc-400 text-lg max-w-md mx-auto">Votre compte a été créé avec succès. Préparation de votre espace...</p>
          <Loader2 className="animate-spin mx-auto text-zinc-700 mt-8" size={32} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-100 uppercase">Rejoignez FleetSaaS</h1>
          <p className="text-zinc-500 mt-3 text-lg font-medium">Choisissez votre profil pour commencer.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[3rem] p-10 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-8 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleSignup} className="space-y-10">
            {/* Sélecteur de Rôle */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <button
                type="button"
                onClick={() => setRole('vendor')}
                className={`relative p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 ${
                  role === 'vendor' 
                    ? 'border-zinc-100 bg-zinc-100 text-zinc-950' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <Store size={28} />
                <div>
                  <p className="font-black text-xl uppercase tracking-tighter">Commerçant</p>
                  <p className="text-sm font-medium opacity-70">Je loue ma flotte de véhicules.</p>
                </div>
                {role === 'vendor' && <CheckCircle2 className="absolute top-6 right-6" size={24} />}
              </button>

              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`relative p-8 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 ${
                  role === 'customer' 
                    ? 'border-zinc-100 bg-zinc-100 text-zinc-950' 
                    : 'border-zinc-800 bg-zinc-950 text-zinc-500 hover:border-zinc-700'
                }`}
              >
                <Users size={28} />
                <div>
                  <p className="font-black text-xl uppercase tracking-tighter">Client</p>
                  <p className="text-sm font-medium opacity-70">Je souhaite louer un véhicule.</p>
                </div>
                {role === 'customer' && <CheckCircle2 className="absolute top-6 right-6" size={24} />}
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Nom Complet</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" size={20} />
                    <input required name="fullName" placeholder="Jean Dupont" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:ring-2 ring-zinc-700 outline-none transition-all" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Email</label>
                  <div className="relative group">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" size={20} />
                    <input required name="email" type="email" placeholder="jean@exemple.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:ring-2 ring-zinc-700 outline-none transition-all" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Mot de passe</label>
                <div className="relative group">
                  <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" size={20} />
                  <input required name="password" type="password" placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:ring-2 ring-zinc-700 outline-none transition-all" />
                </div>
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full py-5 bg-zinc-100 text-zinc-950 rounded-[1.5rem] font-black hover:bg-white transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-white/5">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>CRÉER MON COMPTE <ArrowRight size={22} /></>}
            </button>
          </form>
          
          <p className="text-center mt-8 text-zinc-500 font-medium">
            Déjà un compte ? <Link to="/login" className="text-zinc-100 hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
