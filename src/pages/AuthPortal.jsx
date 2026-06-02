import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Car, User, Building2, Mail, Lock, ArrowRight, CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

const WelcomeToast = ({ isVisible, message, type = 'success' }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, y: -50, x: '-50%' }}
        animate={{ opacity: 1, y: 40, x: '-50%' }}
        exit={{ opacity: 0, y: -50, x: '-50%' }}
        className="fixed top-0 left-1/2 z-[200] flex items-center gap-4 bg-zinc-900 border border-[#D4AF37]/30 p-6 rounded-2xl shadow-2xl backdrop-blur-2xl min-w-[320px]"
      >
        {type === 'success' ? (
          <CheckCircle2 size={20} style={{ color: GOLD }} />
        ) : (
          <AlertCircle size={20} className="text-red-500" />
        )}
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">
            {type === 'success' ? 'Accès Autorisé' : 'Erreur d\'accès'}
          </p>
          <p className="text-xs font-bold text-white uppercase tracking-widest mt-1">{message}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

export default function AuthPortal() {
  const { login, signup } = useAuthStore();
  const [activeTab, setActiveTab] = useState('client');
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const showNotification = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3500);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (isLogin) {
        // CONNEXION via Supabase
        await login(formData.email, formData.password);
        showNotification(`Bienvenue !`);
        // App.jsx détecte automatiquement le changement de session via onAuthStateChange
      } else {
        // INSCRIPTION via Supabase
        if (!formData.name) {
          showNotification('Veuillez entrer votre nom complet', 'error');
          setIsLoading(false);
          return;
        }
        const data = await signup(formData.email, formData.password, formData.name, activeTab);

        // Supabase envoie un email de confirmation par défaut
        // Si email confirmation désactivé dans le dashboard Supabase → connexion directe
        if (data.session) {
          showNotification('Compte créé ! Bienvenue.');
        } else {
          showNotification('Compte créé ! Vérifiez votre email pour confirmer.');
          setIsLogin(true);
        }
        setIsLoading(false);
      }
    } catch (error) {
      const msg = error.message || 'Une erreur est survenue';
      // Traduction des erreurs Supabase
      const errMap = {
        'Invalid login credentials': 'Email ou mot de passe incorrect',
        'Email not confirmed': 'Confirmez votre email avant de vous connecter',
        'User already registered': 'Un compte existe déjà avec cet email',
        'Password should be at least 6 characters': 'Mot de passe trop court (min. 6 caractères)',
      };
      showNotification(errMap[msg] || msg, 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 md:p-8 relative overflow-hidden">
      <WelcomeToast isVisible={toast.show} message={toast.message} type={toast.type} />

      {/* Background */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
        <div className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      </div>

      <div className="text-center mb-12 relative z-10">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-16 h-16 md:w-20 md:h-20 border border-[#D4AF37]/40 rounded-full flex items-center justify-center mx-auto mb-6 bg-black"
        >
          <Car size={32} style={{ color: GOLD }} />
        </motion.div>
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-[0.3em] md:tracking-[0.5em] mb-4">
          Shift <span style={{ color: GOLD }}>Luxury</span>
        </h1>
        <p className="text-zinc-500 text-[8px] md:text-[10px] font-black uppercase tracking-[0.4em]">The Ultimate Fleet Experience</p>
      </div>

      <div className="w-full max-w-md relative z-10">
        {/* Tab Switcher — visible seulement à l'inscription */}
        <AnimatePresence>
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5 mb-4 overflow-hidden"
            >
              <button
                onClick={() => setActiveTab('client')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'client' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                <User size={14} /> Client
              </button>
              <button
                onClick={() => setActiveTab('merchant')}
                className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${activeTab === 'merchant' ? 'bg-[#D4AF37] text-black' : 'text-zinc-500 hover:text-white'}`}
              >
                <Building2 size={14} /> Marchand
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Auth Card */}
        <motion.div
          layout
          className="bg-zinc-900/30 border border-white/5 p-8 md:p-10 rounded-[2.5rem] backdrop-blur-xl"
        >
          <div className="mb-8">
            <h2 className="text-2xl font-black uppercase tracking-tight">
              {isLogin ? 'Connexion' : 'Inscription'} <span style={{ color: GOLD }}>{activeTab === 'client' ? 'Privilège' : 'Partenaire'}</span>
            </h2>
            <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mt-2">
              {isLogin ? 'Entrez vos accès sécurisés' : 'Rejoignez l\'excellence'}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <AnimatePresence mode="wait">
              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="relative"
                >
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
                  <input
                    type="text"
                    placeholder="NOM COMPLET"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-all"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="email"
                placeholder="EMAIL"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
              <input
                type="password"
                placeholder="MOT DE PASSE"
                required
                minLength={6}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full bg-black/50 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-all"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-5 bg-[#D4AF37] text-black rounded-xl font-black uppercase tracking-[0.2em] text-[10px] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-6 shadow-xl shadow-[#D4AF37]/10 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                  <Car size={18} />
                </motion.div>
              ) : (
                <>
                  {isLogin ? 'SE CONNECTER' : 'CRÉER MON COMPTE'}
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={() => { setIsLogin(!isLogin); setFormData({ name: '', email: '', password: '' }); }}
              className="text-zinc-500 hover:text-[#D4AF37] text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              {isLogin ? (
                <><UserPlus size={12} /> Pas encore de compte ? S'inscrire</>
              ) : (
                <><Lock size={12} /> Déjà un compte ? Se connecter</>
              )}
            </button>
          </div>
        </motion.div>

        <p className="text-center text-zinc-600 text-[8px] font-bold uppercase tracking-[0.3em] mt-8">
          Sécurisé par Supabase Auth • Chiffrement AES-256
        </p>
      </div>
    </div>
  );
}
