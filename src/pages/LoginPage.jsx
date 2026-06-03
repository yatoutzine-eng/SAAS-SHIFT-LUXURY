import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Key, Loader2, AlertCircle, ArrowRight, Car } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.target);
    const email = formData.get('email');
    const password = formData.get('password');

    const { data, error: loginError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (loginError) {
      setError("Identifiants invalides. Veuillez réessayer.");
      setLoading(false);
      return;
    }

    // Redirection basée sur le rôle stocké dans les métadonnées
    const role = data.user?.user_metadata?.role;
    
    if (role === 'vendor') {
      window.location.assign('/admin');
    } else {
      window.location.assign('/');
    }
  }

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-[#09090b]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-zinc-100 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-white/5">
            <Car size={32} className="text-zinc-950" />
          </div>
          <h1 className="text-3xl font-black tracking-tight text-zinc-100 uppercase">Bon retour</h1>
          <p className="text-zinc-500 mt-2 font-medium">Accédez à votre espace FleetSaaS.</p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl">
          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-sm font-medium">
              <AlertCircle size={18} /> {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Email</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" size={20} />
                <input required name="email" type="email" placeholder="jean@exemple.com" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:ring-2 ring-zinc-700 outline-none transition-all" />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-zinc-500 uppercase ml-1 tracking-widest">Mot de passe</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-zinc-300 transition-colors" size={20} />
                <input required name="password" type="password" placeholder="••••••••" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-zinc-100 focus:ring-2 ring-zinc-700 outline-none transition-all" />
              </div>
            </div>

            <button disabled={loading} type="submit" className="w-full py-5 bg-zinc-100 text-zinc-950 rounded-2xl font-black hover:bg-white transition-all flex items-center justify-center gap-3 text-lg shadow-xl shadow-white/5">
              {loading ? <Loader2 className="animate-spin" size={24} /> : <>SE CONNECTER <ArrowRight size={22} /></>}
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-zinc-800 text-center">
            <p className="text-zinc-500 font-medium">
              Pas encore de compte ? <br />
              <Link to="/signup" className="text-zinc-100 hover:underline font-bold inline-block mt-2">Créer un compte gratuitement</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
