import React from 'react';
import { motion } from 'framer-motion';
import { Car, LogOut, Fuel, Users, ShieldCheck, Star } from 'lucide-react';
import { useAuthStore } from '../store/useAuthStore';

const GOLD = "#D4AF37";

export default function Storefront() {
  const logout = useAuthStore((state) => state.logout);
  const user = useAuthStore((state) => state.user);

  // Mock data for storefront
  const fleet = JSON.parse(localStorage.getItem('luxury_fleet') || '[]');

  return (
    <div className="min-h-screen bg-black text-white">
      <nav className="h-24 border-b border-[#D4AF37]/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 px-6 lg:px-12 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-[#D4AF37] rounded-full flex items-center justify-center">
            <Car size={20} style={{ color: GOLD }} />
          </div>
          <h1 className="text-xl font-black tracking-widest uppercase">
            Shift <span style={{ color: GOLD }}>Luxury</span>
          </h1>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:block text-right">
            <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Bienvenue</p>
            <p className="text-xs font-bold">{user?.email}</p>
          </div>
          <button 
            onClick={logout}
            className="p-3 bg-zinc-900 border border-zinc-800 rounded-full text-zinc-500 hover:text-red-500 hover:border-red-500/50 transition-all"
          >
            <LogOut size={20} />
          </button>
        </div>
      </nav>

      <main className="p-6 lg:p-12 max-w-[1600px] mx-auto">
        <header className="mb-16">
          <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter mb-4">
            La Collection <span style={{ color: GOLD }}>Privée</span>
          </h2>
          <p className="text-zinc-500 font-bold uppercase tracking-[0.3em] text-xs">Réservez l'exceptionnel en quelques clics</p>
        </header>

        {fleet.length === 0 ? (
          <div className="py-32 text-center border-2 border-dashed border-zinc-800 rounded-[3rem]">
            <Car size={48} className="mx-auto mb-6 text-zinc-800" />
            <p className="text-zinc-500 font-bold uppercase tracking-widest">Le catalogue est actuellement vide</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-10">
            {fleet.map((v) => (
              <motion.div 
                key={v.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                className="group bg-zinc-900/30 border border-zinc-800 rounded-[2.5rem] overflow-hidden hover:border-[#D4AF37]/40 transition-all duration-500"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img src={v.image} alt={v.model} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute top-6 left-6 px-4 py-2 bg-black/60 backdrop-blur-md border border-[#D4AF37]/20 rounded-full flex items-center gap-2">
                    <Star size={12} style={{ color: GOLD }} fill={GOLD} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Nouveauté</span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <h3 className="text-xl font-black uppercase tracking-tight">{v.model}</h3>
                    <div className="text-[#D4AF37] font-black text-xl">{Number(v.price).toLocaleString()} €<span className="text-[10px] text-zinc-500 ml-1">/JOUR</span></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <Fuel size={16} style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase tracking-wider">{v.fuel}</span>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/5">
                      <Users size={16} style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase tracking-wider">{v.seats} Places</span>
                    </div>
                  </div>
                  <button className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#D4AF37] transition-colors">
                    Réserver ce véhicule
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
