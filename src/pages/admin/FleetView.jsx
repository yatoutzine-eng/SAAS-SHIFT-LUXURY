import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, Pencil, Trash2, X, Save, Upload, Image as ImageIcon,
  Zap, Gauge, AlertTriangle, Calendar, Euro, Loader2, RefreshCw
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

export default function FleetView() {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [formData, setFormData] = useState({});
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => { loadFleet(); }, []);

  // Charger la flotte depuis Supabase
  const loadFleet = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('fleet')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error('Erreur chargement flotte:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (vehicle) => {
    setSelectedVehicle(vehicle);
    setFormData({
      ...vehicle,
      description: vehicle.description || '',
      doors: vehicle.doors || 2,
      deposit: vehicle.deposit || 2000,
      weekend_price: vehicle.weekend_price || vehicle.price,
      fuel: vehicle.fuel || 'Essence',
    });
    setImagePreview(vehicle.image || '');
    setIsEditModalOpen(true);
  };

  // Upload image vers Supabase Storage
  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const fileName = `vehicles/${Date.now()}_${file.name.replace(/\s/g, '_')}`;
      const { data, error } = await supabase.storage.from('vehicle-images').upload(fileName, file, { upsert: true });
      if (!error && data) {
        const { data: urlData } = supabase.storage.from('vehicle-images').getPublicUrl(fileName);
        setFormData(f => ({ ...f, image: urlData.publicUrl }));
        setImagePreview(urlData.publicUrl);
      } else {
        // Fallback base64
        const reader = new FileReader();
        reader.onload = (ev) => { setFormData(f => ({ ...f, image: ev.target.result })); setImagePreview(ev.target.result); };
        reader.readAsDataURL(file);
      }
    } catch {
      const reader = new FileReader();
      reader.onload = (ev) => { setFormData(f => ({ ...f, image: ev.target.result })); setImagePreview(ev.target.result); };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
    }
  };

  // Sauvegarder dans Supabase
  const handleSave = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const vehicleData = {
        user_id: user.id,
        model: formData.model,
        price: parseInt(formData.price) || 0,
        weekend_price: parseInt(formData.weekend_price) || parseInt(formData.price) || 0,
        fuel: formData.fuel || 'Essence',
        seats: parseInt(formData.seats) || 2,
        hp: parseInt(formData.hp) || 0,
        speed: parseInt(formData.speed) || 0,
        doors: parseInt(formData.doors) || 2,
        deposit: parseInt(formData.deposit) || 2000,
        description: formData.description || '',
        image: formData.image || '',
        status: formData.status || 'available',
      };

      if (formData.id && typeof formData.id === 'string' && formData.id.includes('-')) {
        // UPDATE — UUID Supabase existant
        const { error } = await supabase.from('fleet').update(vehicleData).eq('id', formData.id);
        if (error) throw error;
      } else {
        // INSERT — nouveau véhicule
        const { error } = await supabase.from('fleet').insert(vehicleData);
        if (error) throw error;
      }

      await loadFleet();
      setIsEditModalOpen(false);
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur : ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // Supprimer dans Supabase
  const confirmDelete = async () => {
    try {
      const { error } = await supabase.from('fleet').delete().eq('id', selectedVehicle.id);
      if (error) throw error;
      await loadFleet();
      setIsDeleteModalOpen(false);
      setSelectedVehicle(null);
    } catch (err) {
      alert('Erreur suppression : ' + err.message);
    }
  };

  const handleAddNew = () => {
    handleEdit({
      model: '', price: 500, fuel: 'Essence', seats: 2,
      hp: 400, speed: 300, image: '', description: '',
      doors: 2, deposit: 2000, weekend_price: 700, status: 'available'
    });
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Chargement de la flotte...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Ma <span className="text-[#D4AF37]">Flotte</span></h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {vehicles.length} véhicule{vehicles.length > 1 ? 's' : ''} — Supabase
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button onClick={loadFleet} className="px-4 py-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all">
            <RefreshCw size={16} />
          </button>
          <button onClick={handleAddNew} className="flex-1 md:flex-none px-8 py-4 bg-white text-black font-black text-[10px] tracking-[0.2em] uppercase rounded-2xl hover:bg-[#D4AF37] transition-all flex items-center justify-center gap-3 group">
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" /> Ajouter un véhicule
          </button>
        </div>
      </header>

      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center">
          <div className="w-20 h-20 bg-zinc-900/50 rounded-3xl flex items-center justify-center mb-6 border border-white/5">
            <ImageIcon size={32} className="text-zinc-700" />
          </div>
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Flotte vide</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-8">Ajoutez votre premier véhicule</p>
          <button onClick={handleAddNew} className="px-8 py-4 bg-[#D4AF37] text-black font-black text-[10px] tracking-[0.2em] uppercase rounded-2xl hover:scale-105 transition-all">
            + Ajouter un véhicule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {vehicles.map(v => (
            <motion.div layoutId={`vehicle-${v.id}`} key={v.id} className="group bg-zinc-900/20 border border-white/5 rounded-[2.5rem] overflow-hidden p-8 hover:border-[#D4AF37]/30 transition-all relative">
              <div className="absolute top-6 right-6 flex gap-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEdit(v)} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/50 transition-all"><Pencil size={16} /></button>
                <button onClick={() => { setSelectedVehicle(v); setIsDeleteModalOpen(true); }} className="p-3 bg-black/60 backdrop-blur-md border border-white/10 rounded-xl text-white hover:text-red-500 hover:border-red-500/50 transition-all"><Trash2 size={16} /></button>
              </div>
              <div className="relative h-48 mb-8 overflow-hidden rounded-3xl bg-zinc-900">
                {v.image
                  ? <img src={v.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt={v.model} />
                  : <div className="w-full h-full flex items-center justify-center"><ImageIcon size={40} className="text-zinc-700" /></div>
                }
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-xl text-[9px] font-black uppercase tracking-widest ${v.status === 'available' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : v.status === 'rented' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'}`}>
                  {v.status === 'available' ? 'Disponible' : v.status === 'rented' ? 'Loué' : 'Maintenance'}
                </div>
              </div>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-1">{v.model}</h3>
                  <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest">{v.fuel} • {v.seats} Places</p>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] font-black text-2xl">{v.price}€</div>
                  <div className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">Par jour</div>
                </div>
              </div>
              {v.weekend_price && v.weekend_price !== v.price && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-[#D4AF37]/10 rounded-xl border border-[#D4AF37]/20">
                  <Calendar size={12} className="text-[#D4AF37]" />
                  <span className="text-[10px] font-black text-[#D4AF37] uppercase tracking-widest">Weekend : {v.weekend_price}€/j</span>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4 pt-6 border-t border-white/5">
                <div className="flex items-center gap-2"><Zap size={14} className="text-zinc-600" /><span className="text-[10px] font-bold text-zinc-400">{v.hp} CV</span></div>
                <div className="flex items-center gap-2"><Gauge size={14} className="text-zinc-600" /><span className="text-[10px] font-bold text-zinc-400">{v.speed} KM/H</span></div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal Édition */}
      <AnimatePresence>
        {isEditModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-zinc-900 border border-white/10 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-8 border-b border-white/5 flex justify-between items-center bg-black/20 sticky top-0 z-10">
                <h3 className="text-2xl font-black uppercase tracking-tighter">Édition <span className="text-[#D4AF37]">Véhicule</span></h3>
                <button onClick={() => setIsEditModalOpen(false)} className="p-2 hover:text-[#D4AF37] transition-colors"><X size={24} /></button>
              </div>
              <form onSubmit={handleSave} className="p-10 space-y-8">
                {/* Upload Image */}
                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Photo du véhicule</label>
                  <div className="relative h-48 bg-zinc-900/50 border-2 border-dashed border-white/10 rounded-2xl overflow-hidden hover:border-[#D4AF37]/50 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                    {imagePreview ? <img src={imagePreview} className="w-full h-full object-cover" alt="preview" /> : (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                        <Upload size={32} className="text-zinc-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Cliquer pour uploader</p>
                        <p className="text-[9px] text-zinc-700 uppercase">JPG, PNG, WEBP • Depuis PC ou téléphone</p>
                      </div>
                    )}
                    {isUploading && (
                      <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                        <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
                      </div>
                    )}
                    {imagePreview && (
                      <div className="absolute bottom-3 right-3 px-3 py-1.5 bg-black/60 backdrop-blur rounded-lg border border-white/10 flex items-center gap-2">
                        <Upload size={12} className="text-[#D4AF37]" />
                        <span className="text-[9px] font-black uppercase text-zinc-300">Changer</span>
                      </div>
                    )}
                  </div>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                  <div className="relative">
                    <ImageIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                    <input type="text" value={formData.image || ''} onChange={(e) => { setFormData({ ...formData, image: e.target.value }); setImagePreview(e.target.value); }}
                      placeholder="Ou collez une URL d'image..." className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-12 text-xs font-bold focus:border-[#D4AF37] outline-none transition-all" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  {[
                    { label: 'Modèle', key: 'model', type: 'text' },
                    { label: 'Carburant', key: 'fuel', type: 'text' },
                    { label: 'Puissance (CV)', key: 'hp', type: 'number' },
                    { label: 'Vitesse Max (km/h)', key: 'speed', type: 'number' },
                    { label: 'Nombre de Portes', key: 'doors', type: 'number', min: 2, max: 6 },
                    { label: 'Places', key: 'seats', type: 'number', min: 1, max: 9 },
                    { label: 'Caution (€)', key: 'deposit', type: 'number' },
                  ].map(({ label, key, type, min, max }) => (
                    <div key={key} className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">{label}</label>
                      <input type={type} min={min} max={max} value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: type === 'number' ? parseInt(e.target.value) || 0 : e.target.value })}
                        className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all" />
                    </div>
                  ))}
                  {/* Statut */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Statut</label>
                    <select value={formData.status || 'available'} onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all">
                      <option value="available">Disponible</option>
                      <option value="rented">Loué</option>
                      <option value="maintenance">Maintenance</option>
                    </select>
                  </div>
                </div>

                {/* Tarification */}
                <div className="bg-zinc-900/50 rounded-2xl border border-white/5 p-6 space-y-4">
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#D4AF37]">Tarification</p>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prix semaine (€/j)</label>
                      <div className="relative">
                        <Euro size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600" />
                        <input type="number" value={formData.price || ''} onChange={(e) => setFormData({ ...formData, price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 pl-10 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Prix weekend (€/j)</label>
                      <div className="relative">
                        <Calendar size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#D4AF37]" />
                        <input type="number" value={formData.weekend_price || ''} onChange={(e) => setFormData({ ...formData, weekend_price: parseInt(e.target.value) || 0 })}
                          className="w-full bg-black/40 border border-[#D4AF37]/30 rounded-2xl p-4 pl-10 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all text-[#D4AF37]" />
                      </div>
                    </div>
                  </div>
                  {formData.weekend_price > formData.price && (
                    <p className="text-[9px] text-emerald-500 font-bold uppercase tracking-widest">
                      +{formData.weekend_price - formData.price}€ le weekend ({Math.round(((formData.weekend_price - formData.price) / formData.price) * 100)}% de plus)
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Description</label>
                  <textarea value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Caractéristiques et équipements..." rows="3"
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-[#D4AF37] outline-none transition-all resize-none" />
                </div>

                <div className="flex gap-4 pt-4">
                  <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Annuler</button>
                  <button type="submit" disabled={isSaving} className="flex-1 py-5 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                    {isSaving ? 'Sauvegarde...' : 'Enregistrer'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Suppression */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[250] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-zinc-900 border border-red-500/20 rounded-[2.5rem] w-full max-w-md p-10 text-center">
              <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-8 border border-red-500/20">
                <AlertTriangle size={40} className="text-red-500" />
              </div>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-4">Retirer du catalogue ?</h3>
              <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest leading-relaxed mb-10">
                Êtes-vous sûr de vouloir retirer la <span className="text-white">{selectedVehicle?.model}</span> de votre flotte ?
              </p>
              <div className="flex flex-col gap-3">
                <button onClick={confirmDelete} className="w-full py-5 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 transition-all">Confirmer</button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">Annuler</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
