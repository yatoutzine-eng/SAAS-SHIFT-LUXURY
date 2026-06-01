import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Plus, Filter, Info, User, Car, Clock, AlertTriangle, X
} from 'lucide-react';
import { 
  format, addMonths, subMonths, startOfMonth, endOfMonth, 
  eachDayOfInterval, isSameDay, isWithinInterval, addDays,
  startOfWeek, endOfWeek, isToday
} from 'date-fns';
import { fr } from 'date-fns/locale';
import { useStore } from '../../store/useStore';

const GOLD = "#D4AF37";

export default function PlanningView() {
  const { vehicles } = useStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedVehicleId, setSelectedVehicleId] = useState('all');
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);

  // Mock des réservations et blocages
  const [events, setEvents] = useState([
    {
      id: 1,
      vehicleId: 1,
      type: 'booking',
      client: 'Jean-Baptiste L.',
      start: addDays(startOfMonth(new Date()), 2),
      end: addDays(startOfMonth(new Date()), 5),
      status: 'Confirmé',
      amount: '4,500€'
    },
    {
      id: 2,
      vehicleId: 2,
      type: 'maintenance',
      reason: 'Révision annuelle',
      start: addDays(startOfMonth(new Date()), 10),
      end: addDays(startOfMonth(new Date()), 12),
      status: 'Bloqué'
    }
  ]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentDate), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);

  const filteredVehicles = selectedVehicleId === 'all' 
    ? vehicles 
    : vehicles.filter(v => v.id === parseInt(selectedVehicleId));

  const getEventsForDay = (day, vehicleId) => {
    return events.filter(e => 
      e.vehicleId === vehicleId && 
      isWithinInterval(day, { start: e.start, end: e.end })
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8"
    >
      {/* Header Planning */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Planning <span className="text-[#D4AF37]">Pro</span></h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Gestion de disponibilité en temps réel</p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          {/* Filtre Véhicule */}
          <div className="relative">
            <select 
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="appearance-none bg-zinc-900 border border-white/10 rounded-xl px-6 py-3 pr-12 text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#D4AF37] transition-colors"
            >
              <option value="all">Toute la flotte</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.model}</option>
              ))}
            </select>
            <Filter size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#D4AF37] pointer-events-none" />
          </div>

          {/* Navigation Date */}
          <div className="flex items-center bg-zinc-900 rounded-xl border border-white/10 p-1">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-2 hover:text-[#D4AF37] transition-colors"><ChevronLeft size={20}/></button>
            <span className="px-4 text-[10px] font-black uppercase tracking-widest min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: fr })}
            </span>
            <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-2 hover:text-[#D4AF37] transition-colors"><ChevronRight size={20}/></button>
          </div>

          <button 
            onClick={() => setShowBlockModal(true)}
            className="bg-white text-black px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-[#D4AF37] transition-colors flex items-center gap-2"
          >
            <Plus size={14} strokeWidth={3} /> Bloquer dates
          </button>
        </div>
      </div>

      {/* Grille Calendrier Custom */}
      <div className="bg-zinc-950 border border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            {/* Header Jours */}
            <div className="grid grid-cols-[250px_1fr] border-b border-white/5">
              <div className="p-6 border-r border-white/5 bg-zinc-900/50">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Véhicules</span>
              </div>
              <div className="grid grid-cols-7">
                {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map(d => (
                  <div key={d} className="p-6 text-center text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 border-r border-white/5 last:border-0">
                    {d}
                  </div>
                ))}
              </div>
            </div>

            {/* Corps du Calendrier */}
            <div className="divide-y divide-white/5">
              {filteredVehicles.map(vehicle => (
                <div key={vehicle.id} className="grid grid-cols-[250px_1fr] group">
                  {/* Info Véhicule */}
                  <div className="p-6 border-r border-white/5 bg-zinc-900/20 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10">
                      <img src={vehicle.image} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                      <h4 className="text-[11px] font-black uppercase leading-tight">{vehicle.model}</h4>
                      <p className="text-[8px] text-zinc-500 font-bold uppercase tracking-widest">{vehicle.fuel}</p>
                    </div>
                  </div>

                  {/* Grille de Jours */}
                  <div className="grid grid-cols-7 relative">
                    {days.slice(0, 7).map((day, idx) => {
                      const dayEvents = getEventsForDay(day, vehicle.id);
                      return (
                        <div 
                          key={idx} 
                          className={`min-h-[100px] border-r border-white/5 last:border-0 p-2 relative transition-colors ${isToday(day) ? 'bg-[#D4AF37]/5' : 'hover:bg-white/[0.02]'}`}
                        >
                          <span className={`text-[9px] font-black ${isToday(day) ? 'text-[#D4AF37]' : 'text-zinc-600'}`}>
                            {format(day, 'd')}
                          </span>

                          {/* Affichage des Événements */}
                          <div className="mt-2 space-y-1">
                            {dayEvents.map(event => (
                              <motion.div
                                key={event.id}
                                layoutId={`event-${event.id}`}
                                onClick={() => setSelectedReservation(event)}
                                className={`
                                  p-2 rounded-lg cursor-pointer text-[8px] font-black uppercase tracking-tighter truncate
                                  ${event.type === 'booking' 
                                    ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' 
                                    : 'bg-zinc-800 text-zinc-400 border border-white/10'}
                                `}
                              >
                                {event.type === 'booking' ? `👤 ${event.client}` : `🛠️ ${event.reason}`}
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

      {/* Modal Détails Réservation */}
      <AnimatePresence>
        {selectedReservation && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setSelectedReservation(null)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <button onClick={() => setSelectedReservation(null)} className="absolute top-6 right-6 text-zinc-500 hover:text-white"><X size={24}/></button>
              
              <div className="flex items-center gap-4 mb-8">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedReservation.type === 'booking' ? 'bg-[#D4AF37]/20 text-[#D4AF37]' : 'bg-zinc-800 text-zinc-400'}`}>
                  {selectedReservation.type === 'booking' ? <User size={24}/> : <AlertTriangle size={24}/>}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tighter">
                    {selectedReservation.type === 'booking' ? 'Détails Réservation' : 'Blocage Technique'}
                  </h3>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">ID: #SHF-{selectedReservation.id}992</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Début</p>
                    <p className="text-xs font-bold">{format(selectedReservation.start, 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                    <p className="text-[8px] text-zinc-500 font-black uppercase mb-1">Fin</p>
                    <p className="text-xs font-bold">{format(selectedReservation.end, 'dd MMMM yyyy', { locale: fr })}</p>
                  </div>
                </div>

                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-zinc-500">Véhicule</span>
                    <span className="text-xs font-bold">{vehicles.find(v => v.id === selectedReservation.vehicleId)?.model}</span>
                  </div>
                  {selectedReservation.type === 'booking' ? (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black uppercase text-zinc-500">Client</span>
                        <span className="text-xs font-bold">{selectedReservation.client}</span>
                      </div>
                      <div className="flex justify-between items-center pt-4 border-t border-white/5">
                        <span className="text-[10px] font-black uppercase text-[#D4AF37]">Total</span>
                        <span className="text-xl font-black text-[#D4AF37]">{selectedReservation.amount}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase text-zinc-500">Raison</span>
                      <span className="text-xs font-bold text-red-500">{selectedReservation.reason}</span>
                    </div>
                  )}
                </div>

                <button className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-[#D4AF37] transition-colors">
                  Gérer le contrat
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal Blocage Manuel */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
              onClick={() => setShowBlockModal(false)}
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="relative w-full max-w-md bg-zinc-950 border border-white/10 rounded-[2.5rem] p-8 shadow-2xl"
            >
              <h3 className="text-2xl font-black uppercase tracking-tighter mb-8">Bloquer un véhicule</h3>
              <form className="space-y-4" onSubmit={(e) => { e.preventDefault(); setShowBlockModal(false); }}>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Véhicule</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#D4AF37]">
                    {vehicles.map(v => <option key={v.id} value={v.id}>{v.model}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Du</label>
                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#D4AF37]" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Au</label>
                    <input type="date" className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#D4AF37]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500 ml-2">Motif du blocage</label>
                  <select className="w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-sm outline-none focus:border-[#D4AF37]">
                    <option>Révision technique</option>
                    <option>Usage privé</option>
                    <option>Nettoyage complet</option>
                    <option>Autre</option>
                  </select>
                </div>
                <button className="w-full py-5 bg-[#D4AF37] text-black rounded-2xl font-black uppercase tracking-widest text-[10px] mt-4">
                  Confirmer l'indisponibilité
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
