import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Plus, Filter, X,
  User, AlertTriangle, RefreshCw, Loader2, Car
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth,
  eachDayOfInterval, isWithinInterval, startOfWeek, endOfWeek, isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

export default function PlanningView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicleId, setSelectedVehicleId] = useState('all');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingBlock, setIsSavingBlock] = useState(false);
  const [blockForm, setBlockForm] = useState({ vehicle_id: '', start_date: '', end_date: '', reason: 'Révision technique' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Charger flotte
      const { data: fleet } = await supabase.from('fleet').select('*').eq('user_id', user.id);
      setVehicles(fleet || []);

      // Charger réservations actives
      const { data: bk } = await supabase
        .from('bookings')
        .select('*, fleet(model, image)')
        .eq('merchant_id', user.id)
        .not('status', 'in', '("cancelled","completed")')
        .order('start_date');
      setBookings(bk || []);

      // Charger blocages manuels
      const { data: bl } = await supabase
        .from('vehicle_blocks')
        .select('*, fleet(model)')
        .eq('merchant_id', user.id);
      setBlocks(bl || []);

    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const weekDays = days.slice(0, 7);

  const filteredVehicles = selectedVehicleId === 'all'
    ? vehicles
    : vehicles.filter(v => v.id === selectedVehicleId);

  const getEventsForDay = (day, vehicleId) => {
    const bkEvents = bookings
      .filter(b => b.vehicle_id === vehicleId && isWithinInterval(day, {
        start: new Date(b.start_date),
        end: new Date(b.end_date)
      }))
      .map(b => ({ ...b, type: 'booking' }));

    const blEvents = blocks
      .filter(bl => bl.vehicle_id === vehicleId && isWithinInterval(day, {
        start: new Date(bl.start_date),
        end: new Date(bl.end_date)
      }))
      .map(bl => ({ ...bl, type: 'block' }));

    return [...bkEvents, ...blEvents];
  };

  const handleSaveBlock = async (e) => {
    e.preventDefault();
    setIsSavingBlock(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('vehicle_blocks').insert({
        merchant_id: user.id,
        vehicle_id: blockForm.vehicle_id,
        start_date: blockForm.start_date,
        end_date: blockForm.end_date,
        reason: blockForm.reason,
      });
      if (error) throw error;
      await loadData();
      setShowBlockModal(false);
      setBlockForm({ vehicle_id: '', start_date: '', end_date: '', reason: 'Révision technique' });
    } catch (err) {
      alert('Erreur : ' + err.message);
    } finally {
      setIsSavingBlock(false);
    }
  };

  if (isLoading) return (
    <div className="flex items-center justify-center h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Chargement du planning...</p>
      </div>
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Planning <span style={{ color: GOLD }}>Pro</span></h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            {bookings.length} réservation{bookings.length > 1 ? 's' : ''} active{bookings.length > 1 ? 's' : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button onClick={loadData} className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all">
            <RefreshCw size={16} />
          </button>

          <div className="relative">
            <select value={selectedVehicleId} onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="appearance-none bg-zinc-900 border border-white/10 rounded-xl px-6 py-3 pr-12 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-colors">
              <option value="all">Toute la flotte</option>
              {vehicles.map(v => <option key={v.id} value={v.id}>{v.model}</option>)}
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" />
          </div>

          <div className="flex items-center bg-zinc-900 rounded-xl border border-white/10 p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:text-[#D4AF37] transition-colors"><ChevronLeft size={20} /></button>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:text-[#D4AF37] transition-colors"><ChevronRight size={20} /></button>
          </div>

          <button onClick={() => setShowBlockModal(true)}
            className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-colors flex items-center gap-2">
            <Plus size={14} strokeWidth={3} /> Bloquer dates
          </button>
        </div>
      </div>

      {/* Légende */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#D4AF37]" /><span className="text-[9px] font-black uppercase text-zinc-500">Réservation</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-zinc-700" /><span className="text-[9px] font-black uppercase text-zinc-500">Bloqué</span></div>
        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded bg-[#D4AF37]/10 border border-[#D4AF37]/30" /><span className="text-[9px] font-black uppercase text-zinc-500">Aujourd'hui</span></div>
      </div>

      {/* Calendrier */}
      {vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 text-center bg-zinc-900/20 border border-white/5 rounded-[2.5rem]">
          <Car size={32} className="text-zinc-700 mb-4" />
          <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">Flotte vide</h3>
          <p className="text-zinc-500 text-xs font-bold uppercase">Ajoutez des véhicules dans "Ma Flotte" d'abord</p>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              {/* Header jours */}
              <div className="grid grid-cols-[220px_1fr] border-b border-white/5">
                <div className="p-5 border-r border-white/5 bg-zinc-900/50">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Véhicules</span>
                </div>
                <div className="grid grid-cols-7">
                  {weekDays.map((day, i) => (
                    <div key={i} className={`p-4 text-center border-r border-white/5 last:border-0 ${isToday(day) ? 'bg-[#D4AF37]/10' : ''}`}>
                      <p className="text-[9px] font-black uppercase text-zinc-500">{format(day, 'EEE', { locale: fr })}</p>
                      <p className={`text-sm font-black mt-1 ${isToday(day) ? 'text-[#D4AF37]' : 'text-zinc-400'}`}>{format(day, 'd')}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Lignes véhicules */}
              <div className="divide-y divide-white/5">
                {filteredVehicles.map(vehicle => (
                  <div key={vehicle.id} className="grid grid-cols-[220px_1fr]">
                    <div className="p-5 border-r border-white/5 bg-zinc-900/20 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-zinc-900 flex-shrink-0">
                        {vehicle.image
                          ? <img src={vehicle.image} className="w-full h-full object-cover" alt="" />
                          : <Car size={20} className="text-zinc-700 m-auto mt-2" />}
                      </div>
                      <div>
                        <h4 className="text-[10px] font-black uppercase leading-tight">{vehicle.model}</h4>
                        <p className={`text-[8px] font-bold uppercase tracking-widest mt-0.5 ${vehicle.status === 'available' ? 'text-emerald-500' : vehicle.status === 'rented' ? 'text-red-400' : 'text-amber-400'}`}>
                          {vehicle.status === 'available' ? 'Disponible' : vehicle.status === 'rented' ? 'Loué' : 'Maintenance'}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-7">
                      {weekDays.map((day, idx) => {
                        const events = getEventsForDay(day, vehicle.id);
                        return (
                          <div key={idx} className={`min-h-[80px] border-r border-white/5 last:border-0 p-1.5 relative ${isToday(day) ? 'bg-[#D4AF37]/5' : 'hover:bg-white/[0.02]'} transition-colors`}>
                            <div className="space-y-1">
                              {events.map((event, ei) => (
                                <motion.div key={ei} whileHover={{ scale: 1.02 }}
                                  onClick={() => setSelectedEvent({ ...event, vehicleModel: vehicle.model })}
                                  className={`p-1.5 rounded-lg cursor-pointer text-[8px] font-black uppercase tracking-tighter truncate ${event.type === 'booking' ? 'bg-[#D4AF37] text-black' : 'bg-zinc-700 text-zinc-300 border border-white/10'}`}>
                                  {event.type === 'booking' ? `👤 ${event.client_name || 'Client'}` : `🛠️ ${event.reason}`}
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      <AnimatePresence>
        {selectedEvent && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setSelectedEvent(null)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <button onClick={() => setSelectedEvent(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24} /></button>

              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedEvent.type === 'booking' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-zinc-800 text-zinc-400'}`}>
                  {selectedEvent.type === 'booking' ? <User size={24} /> : <AlertTriangle size={24} />}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {selectedEvent.type === 'booking' ? 'Réservation' : 'Blocage'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase">{selectedEvent.vehicleModel}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Début</p>
                    <p className="text-xs font-bold">{selectedEvent.start_date ? format(new Date(selectedEvent.start_date), 'dd MMM yyyy', { locale: fr }) : '—'}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Fin</p>
                    <p className="text-xs font-bold">{selectedEvent.end_date ? format(new Date(selectedEvent.end_date), 'dd MMM yyyy', { locale: fr }) : '—'}</p>
                  </div>
                </div>

                {selectedEvent.type === 'booking' && (
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Client</span><span className="text-xs font-bold">{selectedEvent.client_name}</span></div>
                    {selectedEvent.total_price && <div className="flex justify-between pt-3 border-t border-white/5"><span className="text-[10px] font-black uppercase" style={{ color: GOLD }}>Total</span><span className="text-xl font-black" style={{ color: GOLD }}>{selectedEvent.total_price.toLocaleString('fr-FR')}€</span></div>}
                  </div>
                )}

                {selectedEvent.type === 'block' && (
                  <div className="bg-white/5 p-5 rounded-2xl border border-white/5">
                    <div className="flex justify-between"><span className="text-[10px] text-zinc-500 font-black uppercase">Motif</span><span className="text-xs font-bold text-amber-400">{selectedEvent.reason}</span></div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Blocage */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowBlockModal(false)} />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
              <button onClick={() => setShowBlockModal(false)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24} /></button>
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Bloquer un véhicule</h3>
              <form onSubmit={handleSaveBlock} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Véhicule</label>
                  <select required value={blockForm.vehicle_id} onChange={(e) => setBlockForm({ ...blockForm, vehicle_id: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D4AF37]">
                    <option value="">Choisir un véhicule</option>
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Du</label>
                    <input type="date" required value={blockForm.start_date} onChange={(e) => setBlockForm({ ...blockForm, start_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Au</label>
                    <input type="date" required value={blockForm.end_date} onChange={(e) => setBlockForm({ ...blockForm, end_date: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Motif</label>
                  <select value={blockForm.reason} onChange={(e) => setBlockForm({ ...blockForm, reason: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm outline-none focus:border-[#D4AF37]">
                    <option>Révision technique</option>
                    <option>Usage privé</option>
                    <option>Nettoyage complet</option>
                    <option>Autre</option>
                  </select>
                </div>
                <button type="submit" disabled={isSavingBlock}
                  className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4 flex items-center justify-center gap-2 disabled:opacity-50">
                  {isSavingBlock ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                  Confirmer le blocage
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
