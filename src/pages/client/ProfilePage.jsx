import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, FileText, Upload, CheckCircle2, 
  ArrowLeft, Save, Loader2, ShieldCheck, X, 
  FileIcon, Trash2, Camera, Image as ImageIcon
} from 'lucide-react';

const GOLD = "#D4AF37";

const Toast = ({ message, isVisible, onClose }) => (
  <AnimatePresence>
    {isVisible && (
      <motion.div
        initial={{ opacity: 0, x: 100, scale: 0.9 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        exit={{ opacity: 0, x: 50, scale: 0.95 }}
        className="fixed top-8 right-8 z-[100] flex items-center gap-4 bg-black border border-[#D4AF37]/50 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5),0_0_20px_rgba(212,175,55,0.1)] backdrop-blur-xl"
      >
        <div className="w-8 h-8 rounded-full bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
          <CheckCircle2 size={18} style={{ color: GOLD }} />
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Succès</span>
          <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest mt-0.5">{message}</span>
        </div>
        <button onClick={onClose} className="ml-4 p-1 hover:bg-white/5 rounded-lg transition-colors text-zinc-600 hover:text-white">
          <X size={14} />
        </button>
      </motion.div>
    )}
  </AnimatePresence>
);

const DocumentSlot = ({ label, side, onUpload, onRemove, existingDoc }) => {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef(null);

  const handleFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("Fichier trop volumineux (Max 5Mo)");
      return;
    }

    setUploading(true);
    setProgress(0);

    const reader = new FileReader();
    
    // Simulation de progression réaliste pour l'expérience utilisateur
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.random() * 15;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
        
        reader.onload = (event) => {
          const docData = {
            name: file.name,
            type: file.type,
            data: event.target.result,
            side: side,
            uploadedAt: new Date().toISOString()
          };
          onUpload(side, docData);
          setUploading(false);
        };
        reader.readAsDataURL(file);
      }
      setProgress(Math.min(currentProgress, 100));
    }, 150);
  };

  return (
    <div className="space-y-3">
      <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">{label}</label>
      <div 
        onClick={() => !uploading && !existingDoc && inputRef.current?.click()}
        className={`relative aspect-[16/10] rounded-[2rem] border-2 border-dashed transition-all overflow-hidden group ${
          existingDoc 
            ? 'border-green-500/30 bg-green-500/5' 
            : 'border-white/10 bg-white/5 hover:border-[#D4AF37]/40 cursor-pointer'
        }`}
      >
        <input 
          type="file" 
          ref={inputRef} 
          onChange={handleFile} 
          accept="image/*,.pdf" 
          capture="environment"
          className="hidden" 
        />

        <AnimatePresence mode="wait">
          {uploading ? (
            <motion.div 
              key="uploading"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6"
            >
              <div className="relative w-16 h-16 mb-4">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="transparent" className="text-white/5" />
                  <circle 
                    cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="3" fill="transparent" 
                    strokeDasharray={175.9} strokeDashoffset={175.9 - (175.9 * progress) / 100}
                    className="text-[#D4AF37] transition-all duration-300"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-[#D4AF37]">
                  {Math.round(progress)}%
                </div>
              </div>
              <span className="text-[9px] font-black uppercase tracking-widest text-zinc-400">Vérification sécurisée...</span>
            </motion.div>
          ) : existingDoc ? (
            <motion.div 
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 group"
            >
              {existingDoc.type.includes('image') ? (
                <img src={existingDoc.data} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center">
                  <FileIcon size={32} className="text-[#D4AF37] mb-2" />
                  <span className="text-[9px] font-bold text-zinc-400 uppercase tracking-widest px-4 text-center truncate w-full">
                    {existingDoc.name}
                  </span>
                </div>
              )}
              
              {/* Overlay de succès & suppression */}
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 backdrop-blur-sm">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(side); }}
                  className="w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                >
                  <Trash2 size={18} />
                </button>
              </div>
              <div className="absolute top-4 right-4 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle2 size={14} className="text-white" />
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="empty"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center"
            >
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform group-hover:bg-[#D4AF37]/10">
                <Camera size={20} className="text-zinc-500 group-hover:text-[#D4AF37] transition-colors" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400 group-hover:text-white transition-colors">
                Scanner le {side === 'recto' ? 'Recto' : 'Verso'}
              </span>
              <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest mt-1">JPG, PNG ou PDF</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default function ProfilePage({ onBack }) {
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  const [profile, setProfile] = useState(() => {
    const saved = localStorage.getItem('shift_client_profile');
    return saved ? JSON.parse(saved) : { firstName: '', lastName: '', email: '', address: '', phone: '' };
  });

  const [documents, setDocuments] = useState(() => {
    const saved = localStorage.getItem('USER_DOCUMENTS');
    return saved ? JSON.parse(saved) : { recto: null, verso: null };
  });

  const handleSave = (e) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      localStorage.setItem('shift_client_profile', JSON.stringify(profile));
      setLoading(false);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }, 800);
  };

  const handleUpload = (side, docData) => {
    const newDocs = { ...documents, [side]: docData };
    setDocuments(newDocs);
    localStorage.setItem('USER_DOCUMENTS', JSON.stringify(newDocs));
  };

  const handleRemove = (side) => {
    const newDocs = { ...documents, [side]: null };
    setDocuments(newDocs);
    localStorage.setItem('USER_DOCUMENTS', JSON.stringify(newDocs));
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="max-w-4xl mx-auto py-12 px-6 relative"
    >
      <Toast message="PROFIL MIS À JOUR AVEC SUCCÈS" isVisible={showToast} onClose={() => setShowToast(false)} />

      <div className="flex items-center justify-between mb-12">
        <button onClick={onBack} className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 hover:text-[#D4AF37] transition-colors">
          <ArrowLeft size={16} /> Retour au catalogue
        </button>
        <div className="text-right">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Mon <span style={{ color: GOLD }}>Compte</span></h2>
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Paramètres de conciergerie</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-[2rem] p-8 text-center">
            <div className="w-20 h-20 bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-[#D4AF37]/30 rounded-full flex items-center justify-center mx-auto mb-4 relative">
              <User size={32} style={{ color: GOLD }} />
              {documents.recto && documents.verso && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1 border-4 border-black">
                  <ShieldCheck size={14} className="text-white" />
                </div>
              )}
            </div>
            <h3 className="font-black uppercase text-sm tracking-tight">{profile.firstName || 'Client'} {profile.lastName || 'Shift'}</h3>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              {documents.recto && documents.verso ? 'Identité Vérifiée' : 'Vérification Requise'}
            </p>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          <form onSubmit={handleSave} className="bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-10 space-y-6">
            <div className="flex items-center gap-3 mb-4">
              <User size={18} style={{ color: GOLD }} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Informations Personnelles</h4>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prénom</label>
                <input value={profile.firstName} onChange={e => setProfile({...profile, firstName: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[#D4AF37]/40 outline-none transition-all" placeholder="Jean" />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Nom</label>
                <input value={profile.lastName} onChange={e => setProfile({...profile, lastName: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[#D4AF37]/40 outline-none transition-all" placeholder="Dupont" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black uppercase tracking-widest text-zinc-500 ml-2">Email</label>
              <input value={profile.email} onChange={e => setProfile({...profile, email: e.target.value})} className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-sm focus:border-[#D4AF37]/40 outline-none transition-all" placeholder="jean.dupont@luxury.com" />
            </div>
            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Sauvegarder les modifications
            </button>
          </form>

          <div className="bg-zinc-900/40 border border-white/5 backdrop-blur-xl rounded-[2.5rem] p-10">
            <div className="flex items-center gap-3 mb-8">
              <FileText size={18} style={{ color: GOLD }} />
              <h4 className="text-xs font-black uppercase tracking-[0.2em]">Permis de conduire</h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <DocumentSlot 
                label="Recto du permis" 
                side="recto" 
                onUpload={handleUpload} 
                onRemove={handleRemove}
                existingDoc={documents.recto}
              />
              <DocumentSlot 
                label="Verso du permis" 
                side="verso" 
                onUpload={handleUpload} 
                onRemove={handleRemove}
                existingDoc={documents.verso}
              />
            </div>
            
            <div className="mt-8 p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl flex items-start gap-4">
              <ShieldCheck size={20} style={{ color: GOLD }} className="mt-1 shrink-0" />
              <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest leading-relaxed">
                Vos documents sont chiffrés de bout en bout et stockés de manière sécurisée. Ils ne seront utilisés que pour la validation de vos réservations.
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
