import React, { useState, Suspense, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarCheck, Settings,
  LogOut, Car, Menu, X, Calendar as CalendarIcon,
  TrendingUp, Clock, ShieldCheck, AlertCircle,
  ArrowUpRight, DollarSign, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore } from '../../store/useStore';
import PerformanceChart from './PerformanceChart';
import ReservationsView from './ReservationsView';
import SettingsView from './SettingsView';
import PlanningView from './PlanningView';
import FleetView from './FleetView';

const GOLD = "#D4AF37";

const KPICard = ({ title, value, icon: Icon, trend, color = GOLD, onClick }) => (
  <div
    onClick={onClick}
    className={`bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all ${onClick ? 'cursor-pointer' : ''}`}
  >
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Icon size={80} /></div>
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
        <Icon size={20} style={{ color }} />
      </div>
      {trend && (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl lg:text-3xl font-black tracking-tighter">{value}</h3>
  </div>
);

export default function AdminDashboard({ onLogout }) {
  const [activeView, setActiveView] = useState(() => localStorage.getItem('shift_admin_active_view') || 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { vehicles: initialVehicles } = useStore();
  const [fleetCount, setFleetCount] = useState(initialVehicles.length);

  useEffect(() => { localStorage.setItem('shift_admin_active_view', activeView); }, [activeView]);

  useEffect(() => {
    const updateCount = () => {
      const saved = localStorage.getItem('SHIFT_FLEET_DATA');
      if (saved) setFleetCount(JSON.parse(saved).length);
    };
    updateCount();
    window.addEventListener('storage', updateCount);
    return () => window.removeEventListener('storage', updateCount);
  }, []);

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'planning', label: 'Planning', icon: CalendarIcon },
    { id: 'fleet', label: 'Ma Flotte', icon: Car },
    { id: 'bookings', label: 'Réservations', icon: CalendarCheck },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  // Actions urgentes avec navigation
  const urgentActions = [
    { task: "Préparer Ferrari F8", time: "14:00", type: "departure", icon: Car, view: 'fleet' },
    { task: "Vérifier Permis M. Dupont", time: "ASAP", type: "admin", icon: ShieldCheck, view: 'bookings' },
    { task: "Retour Range Rover", time: "17:30", type: "return", icon: Clock, view: 'planning' },
    { task: "Paiement en attente #882", time: "Urgent", type: "payment", icon: AlertCircle, view: 'bookings' },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-16 cursor-pointer group" onClick={() => { setActiveView('dashboard'); setIsMobileMenuOpen(false); }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Car size={24} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none">Shift</h1>
            <p className="text-[10px] text-[#D4AF37] font-bold tracking-[0.2em] uppercase">Merchant</p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest ${activeView === item.id ? "bg-[#D4AF37] text-black shadow-[0_10px_20px_rgba(212,175,55,0.2)]" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}
          >
            <item.icon size={18} /> {item.label}
          </button>
        ))}
      </nav>

      <div className="pt-8 border-t border-white/5">
        <button onClick={onLogout} className="w-full flex items-center justify-between px-6 py-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all duration-300 group">
          <span className="flex items-center gap-3"><LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Se Déconnecter</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <aside className="hidden lg:flex w-80 h-screen sticky top-0 border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl flex-col py-10 px-8">
        <SidebarContent />
      </aside>

      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsMobileMenuOpen(false)} className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] lg:hidden" />
            <motion.aside initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-zinc-950 z-[101] lg:hidden flex flex-col py-10 px-8 border-r border-white/10 shadow-2xl">
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-black/50 backdrop-blur-md z-50">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveView('dashboard')}>
            <div className="w-8 h-8 border border-[#D4AF37] rounded-lg flex items-center justify-center"><Car size={16} style={{ color: GOLD }} /></div>
            <span className="text-sm font-black uppercase tracking-tighter">Shift</span>
          </div>
          <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-[#D4AF37]"><Menu size={24} /></button>
        </header>

        <main className="flex-1 p-6 lg:p-16 overflow-y-auto">
          <Suspense fallback={<div className="flex items-center justify-center h-full text-[#D4AF37] font-black uppercase tracking-widest">Chargement...</div>}>
            <AnimatePresence mode="wait">
              {activeView === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-12">
                  <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                      <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2">Command <span className="text-[#D4AF37]">Center</span></h2>
                      <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Vue d'ensemble de votre empire automobile</p>
                    </div>
                    <div className="flex items-center gap-4 w-full md:w-auto">
                      <button onClick={() => setActiveView('planning')} className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                        Voir Planning
                      </button>
                      <button onClick={() => setActiveView('fleet')} className="flex-1 md:flex-none px-8 py-4 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                        Gérer Flotte
                      </button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <KPICard title="Chiffre d'Affaires" value="42 850 €" icon={DollarSign} trend="+12.5%" onClick={() => setActiveView('bookings')} />
                    <KPICard title="Taux d'Occupation" value="84%" icon={Activity} trend="+5%" onClick={() => setActiveView('planning')} />
                    <KPICard title="Départs Semaine" value="12" icon={Clock} onClick={() => setActiveView('planning')} />
                    <KPICard title="Flotte Active" value={`${fleetCount} Véhicules`} icon={Car} onClick={() => setActiveView('fleet')} />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                      <PerformanceChart dbData={[]} isLoading={false} />
                    </div>

                    <div className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                      <h3 className="text-xl font-black uppercase tracking-tighter mb-8">Actions Urgentes</h3>
                      <div className="space-y-4">
                        {urgentActions.map((item, i) => (
                          <motion.button
                            key={i}
                            whileHover={{ x: 4 }}
                            onClick={() => setActiveView(item.view)}
                            className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all group text-left"
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'payment' ? 'bg-red-500/10 text-red-500' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
                              <item.icon size={18} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[11px] font-black uppercase leading-tight group-hover:text-[#D4AF37] transition-colors truncate">{item.task}</p>
                              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">{item.time}</p>
                            </div>
                            <ArrowUpRight size={14} className="text-zinc-600 group-hover:text-[#D4AF37] transition-colors flex-shrink-0" />
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeView === 'fleet' && <FleetView key="fleet" />}
              {activeView === 'planning' && <PlanningView key="planning" />}
              {activeView === 'bookings' && <ReservationsView key="bookings" />}
              {activeView === 'settings' && <SettingsView key="settings" />}
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  );
}
