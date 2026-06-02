import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Clock, MapPin, AlertTriangle, X, ChevronRight } from 'lucide-react';
import { generateWhatsAppLink } from '../../utils/whatsapp';

const GOLD = "#D4AF37";
const EMERALD = "#10B981";

export default function ConciergeMenu({ reservation, clientName, merchantPhone }) {
  const [isOpen, setIsOpen] = useState(false);

  if (!merchantPhone) return null;

  const actions = [
    { 
      id: 'prolong', 
      label: 'Prolonger ma location', 
      icon: Clock, 
      color: GOLD,
      desc: 'Ajouter des jours à votre expérience'
    },
    { 
      id: 'delivery', 
      label: 'Livraison / Récupération', 
      icon: MapPin, 
      color: 'white',
      desc: 'Modifier le lieu ou l\'heure'
    },
    { 
      id: 'support', 
      label: 'Assistance Technique', 
      icon: AlertTriangle, 
      color: '#EF4444',
      desc: 'Besoin d\'aide immédiate'
    }
  ];

  const handleAction = (type) => {
    const link = generateWhatsAppLink(merchantPhone, type, {
      clientName,
      vehicle: reservation.vehicle,
      resId: reservation.id
    });
    window.open(link, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-80 bg-zinc-900/95 border border-[#D4AF37]/30 backdrop-blur-2xl rounded-[2.5rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden"
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-[#D4AF37]/10 blur-[60px] rounded-full" />
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-widest text-[#D4AF37]">Conciergerie</h4>
                  <p className="text-[10px] font-bold text-zinc-500 uppercase mt-1">Service 24/7 Premium</p>
                </div>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
                  <X size={16} className="text-zinc-500" />
                </button>
              </div>

              <div className="space-y-3">
                {actions.map((action) => (
                  <button
                    key={action.id}
                    onClick={() => handleAction(action.id)}
                    className="w-full group flex items-center gap-4 p-4 bg-white/5 hover:bg-[#D4AF37]/10 border border-white/5 hover:border-[#D4AF37]/30 rounded-2xl transition-all text-left"
                  >
                    <div className="p-2 rounded-xl bg-black/40 group-hover:scale-110 transition-transform">
                      <action.icon size={18} style={{ color: action.color }} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white">{action.label}</p>
                      <p className="text-[8px] font-bold text-zinc-500 uppercase mt-0.5">{action.desc}</p>
                    </div>
                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-[#D4AF37] transition-colors" />
                  </button>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-white/5 flex items-center gap-3">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-emerald-500">Concierge en ligne</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-6 py-4 bg-black border border-[#D4AF37]/50 rounded-full shadow-[0_10px_30px_rgba(212,175,55,0.2)] group"
      >
        <div className="relative">
          <MessageCircle size={20} style={{ color: GOLD }} />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full border-2 border-black" />
        </div>
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white group-hover:text-[#D4AF37] transition-colors">
          Contacter mon Concierge
        </span>
      </motion.button>
    </div>
  );
}
