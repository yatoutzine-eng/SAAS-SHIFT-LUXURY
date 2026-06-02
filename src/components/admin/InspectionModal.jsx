import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Camera, CheckCircle2, ShieldCheck, AlertCircle, Image as ImageIcon, Loader2 } from 'lucide-react';

const GOLD = "#D4AF37";

const INSPECTION_POINTS = [
  { id: 'front', label: 'AVANT', icon: '🚗' },
  { id: 'back', label: 'ARRIÈRE', icon: '🍑' },
  { id: 'left', label: 'CÔTÉ GAUCHE', icon: '⬅️' },
  { id: 'right', label: 'CÔTÉ DROIT', icon: '➡️' }
];

export default function InspectionModal({ reservation, onClose, onComplete }) {
  const [photos, setPhotos] = useState({ front: null, back: null, left: null, right: null });
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const fileInputRefs = {
    front: useRef(null),
    back: useRef(null),
    left: useRef(null),
    right: useRef(null)
  };

  const processImage = (id, file) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size to image size
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw original image
        ctx.drawImage(img, 0, 0);
        
        // Add Watermark Overlay
        const padding = canvas.width * 0.02;
        const fontSize = Math.max(24, canvas.width * 0.025);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, canvas.height - (fontSize * 3), canvas.width, fontSize * 3);
        
        ctx.fillStyle = GOLD;
        ctx.font = `bold ${fontSize}px Inter, sans-serif`;
        
        const timestamp = new Date().toLocaleString('fr-FR', { 
          day: '2-digit', month: '2-digit', year: 'numeric', 
          hour: '2-digit', minute: '2-digit', second: '2-digit' 
        });
        
        ctx.fillText(`ID: ${reservation.id} | ${reservation.vehicle}`, padding, canvas.height - (fontSize * 1.5));
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(`DATE: ${timestamp} | PREUVE SHIFT LUXURY`, padding, canvas.height - (fontSize * 0.5));

        const watermarkedData = canvas.toDataURL('image/jpeg', 0.8);
        setPhotos(prev => ({ ...prev, [id]: watermarkedData }));
        setIsProcessing(false);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (id, e) => {
    const file = e.target.files[0];
    if (file) processImage(id, file);
  };

  const allPhotosCaptured = Object.values(photos).every(p => p !== null);

  const handleSubmit = () => {
    if (allPhotosCaptured && confirmed) {
      onComplete(photos);
    }
  };

  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 md:p-8">
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl"
        onClick={onClose}
      />
      
      <motion.div 
        initial={{ scale: 0.9, opacity: 0, y: 40 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 40 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <ShieldCheck size={18} className="text-[#D4AF37]" />
              <h3 className="text-xl font-black uppercase tracking-tighter">État des Lieux Numérique</h3>
            </div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Véhicule: {reservation.vehicle} • {reservation.id}</p>
          </div>
          <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-all">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid grid-cols-2 gap-4 mb-8">
            {INSPECTION_POINTS.map((point) => (
              <div key={point.id} className="relative group">
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment"
                  className="hidden"
                  ref={fileInputRefs[point.id]}
                  onChange={(e) => handleFileChange(point.id, e)}
                />
                <button
                  onClick={() => fileInputRefs[point.id].current.click()}
                  className={`w-full aspect-[4/3] rounded-3xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 overflow-hidden relative ${
                    photos[point.id] 
                      ? 'border-[#D4AF37] bg-black' 
                      : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-[#D4AF37]/50'
                  }`}
                >
                  {photos[point.id] ? (
                    <>
                      <img src={photos[point.id]} alt={point.label} className="w-full h-full object-cover opacity-60" />
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                        <CheckCircle2 size={32} className="text-[#D4AF37] mb-2" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">{point.label} OK</span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 bg-[#D4AF37]/10 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={28} className="text-[#D4AF37]" />
                      </div>
                      <div className="text-center">
                        <span className="block text-[10px] font-black uppercase tracking-widest text-white">{point.label}</span>
                        <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">Cliquer pour capturer</span>
                      </div>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>

          {/* Validation Section */}
          <div className="bg-black/40 border border-white/5 rounded-3xl p-6 space-y-6">
            <div className="flex items-start gap-4">
              <div className={`mt-1 w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${confirmed ? 'bg-[#D4AF37] border-[#D4AF37]' : 'border-white/20'}`} onClick={() => setConfirmed(!confirmed)}>
                {confirmed && <CheckCircle2 size={14} className="text-black" />}
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-medium">
                Je confirme que le véhicule <span className="text-white font-bold">{reservation.vehicle}</span> est en parfait état de marche et de carrosserie, conformément aux photos horodatées ci-dessus. Cette inspection fait foi en cas de litige.
              </p>
            </div>

            <button
              disabled={!allPhotosCaptured || !confirmed || isProcessing}
              onClick={handleSubmit}
              className="w-full py-5 bg-[#D4AF37] disabled:bg-zinc-800 disabled:text-zinc-500 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl shadow-[#D4AF37]/10"
            >
              {isProcessing ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <ShieldCheck size={20} /> Valider l'état des lieux
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
