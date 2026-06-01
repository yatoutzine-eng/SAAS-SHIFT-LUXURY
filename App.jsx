import React from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ShieldCheck, Zap, Lock } from 'lucide-react';

const GOLD = "#D4AF37";

export default function HolographicCard({ vehicle, isLocked = false }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);

  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["15deg", "-15deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-15deg", "15deg"]);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        rotateY,
        rotateX,
        transformStyle: "preserve-3d",
      }}
      className={`relative aspect-[3/4] w-full rounded-[2rem] overflow-hidden group cursor-pointer ${
        isLocked ? 'opacity-40 grayscale' : ''
      }`}
    >
      {/* Glassmorphism Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black border border-white/10 group-hover:border-[#D4AF37]/50 transition-colors duration-500" />
      
      {/* Holographic Shine Effect */}
      <motion.div 
        className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-tr from-transparent via-white to-transparent pointer-events-none"
        style={{
          translateX: useTransform(mouseXSpring, [-0.5, 0.5], ["-100%", "100%"]),
        }}
      />

      {/* Vehicle Image */}
      <div className="absolute inset-0 p-1">
        <div className="relative h-1/2 w-full overflow-hidden rounded-t-[1.8rem]">
          <img 
            src={vehicle.image} 
            alt={vehicle.model} 
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col h-1/2 justify-between" style={{ transform: "translateZ(30px)" }}>
          <div>
            <div className="flex justify-between items-start mb-2">
              <h4 className="text-lg font-black uppercase tracking-tighter text-white leading-tight">
                {vehicle.model.split(' ')[0]} <br/>
                <span style={{ color: GOLD }}>{vehicle.model.split(' ').slice(1).join(' ')}</span>
              </h4>
              {!isLocked && (
                <div className="bg-[#D4AF37]/20 p-1.5 rounded-lg border border-[#D4AF37]/30">
                  <ShieldCheck size={14} style={{ color: GOLD }} />
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-4">
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Puissance</span>
                <span className="text-xs font-bold text-white">{vehicle.hp} CV</span>
              </div>
              <div className="w-px h-6 bg-white/10" />
              <div className="flex flex-col">
                <span className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">V-Max</span>
                <span className="text-xs font-bold text-white">{vehicle.speed} KM/H</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {isLocked ? (
              <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-zinc-500">
                <Lock size={12} /> Louez ce monstre
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Zap size={12} style={{ color: GOLD }} />
                  <span className="text-[9px] font-black uppercase tracking-widest text-[#D4AF37]">Certified Pilot</span>
                </div>
                <p className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest">
                  Acquis le {vehicle.acquiredDate || '12/10/2023'}
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Golden Border Glow */}
      <div className="absolute inset-0 border-2 border-[#D4AF37]/0 group-hover:border-[#D4AF37]/20 rounded-[2rem] transition-all duration-500 pointer-events-none" />
    </motion.div>
  );
}
