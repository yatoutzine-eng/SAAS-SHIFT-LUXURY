import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, CheckCircle2, AlertTriangle, Camera, Loader2,
  ShieldCheck, FileText, ChevronRight, ChevronLeft,
  Check, Minus, AlertCircle, Car, Fuel, Gauge,
  Eye, Lightbulb, Wind, Settings, Zap
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

// ── Points de contrôle ───────────────────────────────────────────────────────
const CHECKLIST_SECTIONS = [
  {
    id: 'exterior',
    label: 'Extérieur',
    icon: Car,
    points: [
      { id: 'front_bumper',   label: 'Pare-choc avant' },
      { id: 'rear_bumper',    label: 'Pare-choc arrière' },
      { id: 'hood',           label: 'Capot' },
      { id: 'trunk',          label: 'Coffre' },
      { id: 'left_door',      label: 'Porte gauche' },
      { id: 'right_door',     label: 'Porte droite' },
      { id: 'left_mirror',    label: 'Rétroviseur gauche' },
      { id: 'right_mirror',   label: 'Rétroviseur droit' },
      { id: 'windshield',     label: 'Pare-brise' },
      { id: 'rear_window',    label: 'Lunette arrière' },
      { id: 'roof',           label: 'Toit' },
      { id: 'wheels',         label: 'Jantes & pneus (4)' },
    ]
  },
  {
    id: 'interior',
    label: 'Intérieur',
    icon: Settings,
    points: [
      { id: 'seats',          label: 'Sièges & revêtements' },
      { id: 'dashboard',      label: 'Tableau de bord' },
      { id: 'steering_wheel', label: 'Volant' },
      { id: 'carpet',         label: 'Tapis de sol' },
      { id: 'ceiling',        label: 'Ciel de toit' },
      { id: 'gearbox',        label: 'Boîte de vitesse' },
      { id: 'ac',             label: 'Climatisation' },
      { id: 'radio',          label: 'Système audio' },
    ]
  },
  {
    id: 'mechanical',
    label: 'Mécanique',
    icon: Gauge,
    points: [
      { id: 'engine',         label: 'Moteur (fuite visible)' },
      { id: 'brakes',         label: 'Freins' },
      { id: 'lights_front',   label: 'Phares avant' },
      { id: 'lights_rear',    label: 'Feux arrière' },
      { id: 'indicators',     label: 'Clignotants' },
      { id: 'horn',           label: 'Klaxon' },
      { id: 'wipers',         label: 'Essuie-glaces' },
      { id: 'spare_wheel',    label: 'Roue de secours' },
    ]
  },
  {
    id: 'documents',
    label: 'Documents & Équipements',
    icon: FileText,
    points: [
      { id: 'car_registration', label: 'Carte grise' },
      { id: 'insurance',        label: 'Attestation assurance' },
      { id: 'warning_triangle', label: 'Triangle de signalisation' },
      { id: 'vest',             label: 'Gilet fluorescent' },
      { id: 'first_aid',        label: 'Trousse de secours' },
      { id: 'keys',             label: 'Clés (toutes)' },
    ]
  }
];

// États possibles pour chaque point
const STATES = {
  ok:      { label: 'OK',      color: 'emerald', icon: Check },
  issue:   { label: 'Dommage', color: 'red',     icon: AlertTriangle },
  missing: { label: 'Absent',  color: 'amber',   icon: Minus },
};

// ── Photos zones ─────────────────────────────────────────────────────────────
const PHOTO_ZONES = [
  { id: 'front',      label: 'Avant',         emoji: '⬆️' },
  { id: 'rear',       label: 'Arrière',       emoji: '⬇️' },
  { id: 'left',       label: 'Côté gauche',   emoji: '⬅️' },
  { id: 'right',      label: 'Côté droit',    emoji: '➡️' },
  { id: 'interior',   label: 'Intérieur',     emoji: '🪑' },
  { id: 'dashboard',  label: 'Tableau bord',  emoji: '🎛️' },
];

// ── Watermark sur photo ───────────────────────────────────────────────────────
const processPhoto = (file, reservation) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        const fs = Math.max(20, canvas.width * 0.022);
        ctx.fillStyle = 'rgba(0,0,0,0.65)';
        ctx.fillRect(0, canvas.height - fs * 3.2, canvas.width, fs * 3.2);
        ctx.fillStyle = GOLD;
        ctx.font = `bold ${fs}px Arial`;
        ctx.fillText(`${reservation.vehicle || 'Véhicule'} · Réf: ${reservation.id?.slice(0, 8).toUpperCase()}`, 16, canvas.height - fs * 1.8);
        ctx.fillStyle = '#fff';
        ctx.font = `bold ${fs * 0.85}px Arial`;
        ctx.fillText(`Shift Luxury · ${new Date().toLocaleString('fr-FR')}`, 16, canvas.height - fs * 0.5);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });

// ── COMPOSANT PRINCIPAL ──────────────────────────────────────────────────────
export default function ChecklistModal({ reservation, type = 'checkin', onClose, onComplete }) {
  const [step, setStep] = useState(0); // 0=checklist, 1=photos, 2=notes, 3=recap
  const [checklistState, setChecklistState] = useState({});
  const [photos, setPhotos] = useState({});
  const [uploadingPhoto, setUploadingPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [fuelLevel, setFuelLevel] = useState(100);
  const [mileage, setMileage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileRefs = useRef({});

  const isCheckin = type === 'checkin';
  const totalPoints = CHECKLIST_SECTIONS.reduce((s, sec) => s + sec.points.length, 0);
  const checkedPoints = Object.keys(checklistState).length;
  const issueCount = Object.values(checklistState).filter(v => v === 'issue').length;
  const missingCount = Object.values(checklistState).filter(v => v === 'missing').length;
  const photoCount = Object.keys(photos).length;

  const setPoint = (id, state) => {
    setChecklistState(prev => ({ ...prev, [id]: state }));
  };

  const handlePhoto = async (zoneId, file) => {
    if (!file) return;
    setUploadingPhoto(zoneId);
    try {
      const processed = await processPhoto(file, reservation);
      setPhotos(prev => ({ ...prev, [zoneId]: processed }));
    } catch (e) { console.error(e); }
    finally { setUploadingPhoto(null); }
  };

  const handleSubmit = async () => {
    setIsSaving(true);
    try {
      const checklistData = {
        type,
        date: new Date().toISOString(),
        checklist: checklistState,
        photos: Object.keys(photos),
        notes,
        fuel_level: fuelLevel,
        mileage,
        issue_count: issueCount,
        missing_count: missingCount,
      };
      onComplete(checklistData);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const steps = [
    { label: 'Checklist', icon: CheckCircle2 },
    { label: 'Photos',    icon: Camera },
    { label: 'Relevés',   icon: Gauge },
    { label: 'Récap',     icon: FileText },
  ];

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={onClose} />

      <motion.div initial={{ scale: 0.92, opacity: 0, y: 32 }} animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 32 }}
        className="relative w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh' }}
      >

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-white/5 bg-black/20 flex-shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <ShieldCheck size={20} style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter">
                État des Lieux — <span style={{ color: GOLD }}>{isCheckin ? 'Départ' : 'Retour'}</span>
              </h3>
              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                {reservation.vehicle} · {reservation.id?.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 hover:bg-red-500/20 hover:text-red-500 rounded-full flex items-center justify-center transition-all">
            <X size={20} />
          </button>
        </div>

        {/* ── Stepper ── */}
        <div className="flex items-center gap-0 px-8 py-4 border-b border-white/5 bg-black/10 flex-shrink-0">
          {steps.map((s, i) => (
            <React.Fragment key={i}>
              <button onClick={() => i < step && setStep(i)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${step === i ? 'bg-[#D4AF37] text-black' : i < step ? 'text-emerald-400 cursor-pointer hover:bg-white/5' : 'text-zinc-600'}`}>
                {i < step ? <Check size={12} /> : <s.icon size={12} />}
                {s.label}
              </button>
              {i < steps.length - 1 && <ChevronRight size={12} className="text-zinc-700 mx-1 flex-shrink-0" />}
            </React.Fragment>
          ))}
          <div className="ml-auto text-[10px] font-black uppercase text-zinc-600">
            {checkedPoints}/{totalPoints} vérifiés
          </div>
        </div>

        {/* ── Content ── */}
        <div className="flex-1 overflow-y-auto p-8">
          <AnimatePresence mode="wait">

            {/* ÉTAPE 0 — Checklist */}
            {step === 0 && (
              <motion.div key="checklist" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8">
                {CHECKLIST_SECTIONS.map(section => (
                  <div key={section.id}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center">
                        <section.icon size={15} className="text-zinc-400" />
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-tighter">{section.label}</h4>
                      <div className="flex-1 h-px bg-white/5" />
                      <span className="text-[9px] text-zinc-600 font-bold uppercase">
                        {section.points.filter(p => checklistState[p.id]).length}/{section.points.length}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.points.map(point => {
                        const state = checklistState[point.id];
                        return (
                          <div key={point.id}
                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                              state === 'ok'      ? 'bg-emerald-500/10 border-emerald-500/30' :
                              state === 'issue'   ? 'bg-red-500/10 border-red-500/30' :
                              state === 'missing' ? 'bg-amber-500/10 border-amber-500/30' :
                              'bg-white/[0.03] border-white/5 hover:border-white/10'
                            }`}>
                            <span className={`text-[11px] font-bold uppercase tracking-wide ${state ? 'text-white' : 'text-zinc-500'}`}>
                              {point.label}
                            </span>
                            <div className="flex gap-1.5">
                              {Object.entries(STATES).map(([key, cfg]) => (
                                <button key={key} onClick={() => setPoint(point.id, key)}
                                  className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all ${
                                    state === key
                                      ? key === 'ok'      ? 'bg-emerald-500 text-white'
                                      : key === 'issue'   ? 'bg-red-500 text-white'
                                      : 'bg-amber-500 text-black'
                                      : 'bg-white/5 text-zinc-600 hover:bg-white/10'
                                  }`}
                                  title={cfg.label}>
                                  <cfg.icon size={12} />
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* Légende */}
                <div className="flex items-center gap-4 p-4 bg-white/[0.02] rounded-2xl border border-white/5">
                  <span className="text-[9px] font-black uppercase text-zinc-600 tracking-widest">Légende :</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-400"><Check size={10} /> OK</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-red-400"><AlertTriangle size={10} /> Dommage</span>
                  <span className="flex items-center gap-1.5 text-[9px] font-bold text-amber-400"><Minus size={10} /> Absent</span>
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 1 — Photos */}
            {step === 1 && (
              <motion.div key="photos" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
                  Photos horodatées et marquées automatiquement · {photoCount}/6
                </p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {PHOTO_ZONES.map(zone => (
                    <div key={zone.id}>
                      <input type="file" accept="image/*" capture="environment" className="hidden"
                        ref={el => fileRefs.current[zone.id] = el}
                        onChange={e => e.target.files[0] && handlePhoto(zone.id, e.target.files[0])} />
                      <button onClick={() => fileRefs.current[zone.id]?.click()}
                        className={`w-full aspect-[4/3] rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 overflow-hidden relative transition-all ${
                          photos[zone.id] ? 'border-[#D4AF37]' : 'border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.02]'
                        }`}>
                        {uploadingPhoto === zone.id ? (
                          <Loader2 size={24} className="animate-spin text-[#D4AF37]" />
                        ) : photos[zone.id] ? (
                          <>
                            <img src={photos[zone.id]} alt={zone.label} className="w-full h-full object-cover opacity-70" />
                            <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center">
                              <CheckCircle2 size={24} style={{ color: GOLD }} />
                              <span className="text-[9px] font-black uppercase text-white mt-1">{zone.label}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <span className="text-2xl">{zone.emoji}</span>
                            <span className="text-[9px] font-black uppercase text-zinc-500">{zone.label}</span>
                            <Camera size={14} className="text-zinc-700" />
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 2 — Relevés */}
            {step === 2 && (
              <motion.div key="releves" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-8 max-w-xl mx-auto">

                {/* Carburant */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <Fuel size={16} style={{ color: GOLD }} />
                    <h4 className="text-sm font-black uppercase tracking-tighter">Niveau de carburant</h4>
                    <span className="ml-auto text-2xl font-black" style={{ color: GOLD }}>{fuelLevel}%</span>
                  </div>
                  <input type="range" min="0" max="100" step="5" value={fuelLevel}
                    onChange={e => setFuelLevel(parseInt(e.target.value))}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#D4AF37] bg-zinc-800" />
                  <div className="flex justify-between text-[9px] font-black uppercase text-zinc-600">
                    <span>Vide</span><span>¼</span><span>½</span><span>¾</span><span>Plein</span>
                  </div>
                  {/* Barre visuelle */}
                  <div className="h-3 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${fuelLevel}%`, background: fuelLevel < 20 ? '#EF4444' : fuelLevel < 50 ? '#F59E0B' : GOLD }} />
                  </div>
                </div>

                {/* Kilométrage */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Gauge size={16} style={{ color: GOLD }} />
                    <h4 className="text-sm font-black uppercase tracking-tighter">Kilométrage</h4>
                  </div>
                  <div className="relative">
                    <input type="number" placeholder="Ex: 12 450 km" value={mileage}
                      onChange={e => setMileage(e.target.value)}
                      className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-lg font-black outline-none focus:border-[#D4AF37]/50 transition-all" />
                    <span className="absolute right-5 top-1/2 -translate-y-1/2 text-zinc-500 text-sm font-bold">km</span>
                  </div>
                </div>

                {/* Notes */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <FileText size={16} className="text-zinc-400" />
                    <h4 className="text-sm font-black uppercase tracking-tighter">Notes & Observations</h4>
                  </div>
                  <textarea rows={4} placeholder="Remarques, dommages constatés, précisions..."
                    value={notes} onChange={e => setNotes(e.target.value)}
                    className="w-full bg-black border border-white/10 rounded-2xl px-5 py-4 text-sm font-bold outline-none focus:border-[#D4AF37]/50 transition-all resize-none" />
                </div>
              </motion.div>
            )}

            {/* ÉTAPE 3 — Récap */}
            {step === 3 && (
              <motion.div key="recap" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                className="space-y-6 max-w-2xl mx-auto">

                <h3 className="text-2xl font-black uppercase tracking-tighter">
                  Récapitulatif <span style={{ color: GOLD }}>{isCheckin ? 'Départ' : 'Retour'}</span>
                </h3>

                {/* Résumé checklist */}
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Vérifiés', value: checkedPoints, color: 'text-white' },
                    { label: 'Dommages', value: issueCount, color: issueCount > 0 ? 'text-red-400' : 'text-zinc-500' },
                    { label: 'Absents', value: missingCount, color: missingCount > 0 ? 'text-amber-400' : 'text-zinc-500' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 text-center">
                      <p className="text-[9px] font-black uppercase text-zinc-500 mb-2">{label}</p>
                      <p className={`text-3xl font-black ${color}`}>{value}</p>
                    </div>
                  ))}
                </div>

                {/* Relevés */}
                <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6 space-y-4">
                  <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-4">Relevés</h4>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-xs font-bold uppercase text-zinc-400">Carburant</span>
                    <span className="font-black" style={{ color: GOLD }}>{fuelLevel}%</span>
                  </div>
                  <div className="flex justify-between items-center border-b border-white/5 pb-3">
                    <span className="text-xs font-bold uppercase text-zinc-400">Kilométrage</span>
                    <span className="font-black">{mileage ? `${parseInt(mileage).toLocaleString('fr-FR')} km` : 'Non renseigné'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase text-zinc-400">Photos</span>
                    <span className="font-black">{photoCount}/6</span>
                  </div>
                </div>

                {/* Notes */}
                {notes && (
                  <div className="bg-zinc-900/50 border border-white/5 rounded-2xl p-6">
                    <h4 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest mb-3">Notes</h4>
                    <p className="text-sm text-zinc-300 leading-relaxed">{notes}</p>
                  </div>
                )}

                {/* Alerte dommages */}
                {(issueCount > 0 || missingCount > 0) && (
                  <div className="flex items-start gap-3 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                    <AlertTriangle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] font-bold text-amber-300 uppercase">
                      {issueCount > 0 && `${issueCount} dommage${issueCount > 1 ? 's' : ''} constaté${issueCount > 1 ? 's' : ''}. `}
                      {missingCount > 0 && `${missingCount} élément${missingCount > 1 ? 's' : ''} manquant${missingCount > 1 ? 's' : ''}.`}
                    </p>
                  </div>
                )}

                {/* Date & Signature */}
                <div className="bg-zinc-900/50 border border-[#D4AF37]/20 rounded-2xl p-6 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Date & Heure</p>
                    <p className="text-sm font-black">{new Date().toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black uppercase text-zinc-500 tracking-widest mb-1">Type</p>
                    <span className="text-sm font-black" style={{ color: GOLD }}>{isCheckin ? 'État départ' : 'État retour'}</span>
                  </div>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* ── Footer Navigation ── */}
        <div className="flex items-center justify-between px-8 py-6 border-t border-white/5 bg-black/20 flex-shrink-0">
          <button
            onClick={() => step > 0 ? setStep(step - 1) : onClose()}
            className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
            <ChevronLeft size={14} />
            {step === 0 ? 'Annuler' : 'Retour'}
          </button>

          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-[#D4AF37]' : i < step ? 'w-3 bg-emerald-500' : 'w-3 bg-zinc-700'}`} />
            ))}
          </div>

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
              Suivant <ChevronRight size={14} />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all disabled:opacity-50">
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <ShieldCheck size={14} />}
              {isSaving ? 'Sauvegarde...' : 'Valider l\'état des lieux'}
            </button>
          )}
        </div>

      </motion.div>
    </div>
  );
}

