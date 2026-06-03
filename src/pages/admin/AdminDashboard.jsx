import React, { useState, Suspense, useEffect } from 'react';
import { 
  LayoutDashboard, CalendarCheck, Settings,
  LogOut, Car, Menu, X, Calendar as CalendarIcon,
  Clock, ShieldCheck, ArrowUpRight, DollarSign, Activity, Globe, Bell, BarChart2, Building2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PerformanceChart from './PerformanceChart';
import ReservationsView from './ReservationsView';
import SettingsView from './SettingsView';
import PlanningView from './PlanningView';
import FleetView from './FleetView';
import StatsView from './StatsView';
import AgencyProfileView from './AgencyProfileView';
import HomeMapModal from '../HomeMapModal';
import NotificationsPanel from '../../components/admin/NotificationsPanel';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

const KPICard = ({ title, value, icon: Icon, trend, color = GOLD, onClick, isLoading }) => (
  <div onClick={onClick} className={`bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all ${onClick ? 'cursor-pointer' : ''}`}>
    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity"><Icon size={80} /></div>
    <div className="flex items-start justify-between mb-4">
      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
        <Icon size={20} style={{ color }} />
      </div>
      {trend && !isLoading && (
        <span className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full">
          <ArrowUpRight size={12} /> {trend}
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    {isLoading
      ? <div className="h-8 w-24 bg-zinc-800 rounded-xl animate-pulse" />
      : <h3 className="text-2xl lg:text-3xl font-black tracking-tighter">{value}</h3>
    }
  </div>
);

export default function AdminDashboard({ onLogout }) {
  const [activeView, setActiveView] = useState(() => localStorage.getItem('shift_admin_active_view') || 'dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [stats, setStats] = useState({ revenue: 0, occupancy: 0, weekDepartures: 0, fleetCount: 0, pendingCount: 0 });
  const [chartData, setChartData] = useState([]);
  const [urgentActions, setUrgentActions] = useState([]);

  useEffect(() => { localStorage.setItem('shift_admin_active_view', activeView); }, [activeView]);
  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    try {
      setIsLoadingStats(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: fleet } = await supabase.from('fleet').select('*').eq('user_id', user.id);
      const fleetCount = fleet?.length || 0;
      const rentedCount = fleet?.filter(v => v.status === 'rented').length || 0;
      const occupancy = fleetCount > 0 ? Math.round((rentedCount / fleetCount) * 100) : 0;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, fleet(model)')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false });

      const allBookings = bookings || [];

      const revenue = allBookings
        .filter(b => ['completed', 'in_progress', 'signed'].includes(b.status))
        .reduce((sum, b) => sum + (b.total_price || 0), 0);

      const today = new Date();
      const weekEnd = new Date(today); weekEnd.setDate(today.getDate() + 7);
      const weekDepartures = allBookings.filter(b => {
        const start = new Date(b.start_date);
        return start >= today && start <= weekEnd && b.status !== 'cancelled';
      }).length;

      const pendingCount = allBookings.filter(b => b.status === 'pending').length;

      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (6 - i));
        return d;
      });
      const chart = last7Days.map(day => {
        const dayStr = day.toISOString().split('T')[0];
        const dayRevenue = allBookings
          .filter(b => b.start_date === dayStr && b.total_price)
          .reduce((sum, b) => sum + b.total_price, 0);
        return {
          name: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
          total: dayRevenue
        };
      });
      setChartData(chart);

      const actions = [];
      const todayStr = today.toISOString().split('T')[0];
      allBookings
        .filter(b => b.start_date === todayStr && b.status === 'confirmed')
        .slice(0, 2)
        .forEach(b => actions.push({
          task: `Préparer ${b.fleet?.model || 'véhicule'}`,
          time: 'Aujourd\'hui', type: 'departure', icon: Car, view: 'fleet'
        }));
      if (pendingCount > 0) actions.push({
        task: `${pendingCount} réservation${pendingCount > 1 ? 's' : ''} en attente`,
        time: 'À confirmer', type: 'admin', icon: ShieldCheck, view: 'bookings'
      });
      allBookings
        .filter(b => b.end_date === todayStr && b.status === 'in_progress')
        .slice(0, 1)
        .forEach(b => actions.push({
          task: `Retour ${b.fleet?.model || 'véhicule'}`,
          time: 'Aujourd\'hui', type: 'return', icon: Clock, view: 'planning'
        }));

      if (actions.length === 0) actions.push({
        task: 'Aucune action urgente', time: 'Tout est OK ✓', type: 'ok', icon: ShieldCheck, view: 'bookings'
      });

      setStats({ revenue, occupancy, weekDepartures, fleetCount, pendingCount });
      setUrgentActions(actions);
    } catch (err) {
      console.error('Erreur stats:', err);
    } finally {
      setIsLoadingStats(false);
    }
  };

  const navItems = [
    { id: 'dashboard', label: 'Tableau de Bord', icon: LayoutDashboard },
    { id: 'planning', label: 'Planning', icon: CalendarIcon },
    { id: 'fleet', label: 'Ma Flotte', icon: Car },
    { id: 'bookings', label: 'Réservations', icon: CalendarCheck },
    { id: 'stats', label: 'Statistiques', icon: BarChart2 },
    { id: 'agency', label: 'Profil Agence', icon: Building2 },
    { id: 'settings', label: 'Paramètres', icon: Settings },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-16 cursor-pointer group" onClick={() => { setIsMapOpen(true); setIsMobileMenuOpen(false); }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 border-2 border-[#D4AF37] rounded-2xl flex items-center justify-center rotate-3 group-hover:rotate-0 transition-transform duration-500">
            <Car size={24} style={{ color: GOLD }} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tighter uppercase leading-none group-hover:text-[#D4AF37] transition-colors">Shift</h1>
            <p className="text-[10px] text-[#D4AF37] font-bold tracking-[0.2em] uppercase flex items-center gap-1">
              <Globe size={10} /> Merchant
            </p>
          </div>
        </div>
        <button onClick={(e) => { e.stopPropagation(); setIsMobileMenuOpen(false); }} className="lg:hidden p-2 text-zinc-500 hover:text-white transition-colors">
          <X size={24} />
        </button>
      </div>

      <nav className="flex-1 space-y-3">
        {navItems.map(item => (
          <button key={item.id} onClick={() => { setActiveView(item.id); setIsMobileMenuOpen(false); }}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest ${activeView === item.id ? "bg-[#D4AF37] text-black shadow-[0_10px_20px_rgba(212,175,55,0.2)]" : "text-zinc-500 hover:text-white hover:bg-white/5"}`}>
            <item.icon size={18} />
            <span>{item.label}</span>
            {item.id === 'bookings' && stats.pendingCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{stats.pendingCount}</span>
            )}
          </button>
        ))}
      </nav>

      <div className="py-4 border-t border-white/5 mb-2">
        <button onClick={() => setIsMapOpen(true)}
          className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest text-zinc-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/5 transition-all border border-transparent hover:border-[#D4AF37]/20">
          <Globe size={18} /> Réseau mondial
        </button>
      </div>

      <div className="pt-4 border-t border-white/5">
        <button onClick={onLogout} className="w-full flex items-center justify-between px-6 py-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500 font-black uppercase tracking-widest text-[10px] hover:bg-red-500 hover:text-white transition-all duration-300 group">
          <span className="flex items-center gap-3"><LogOut size={16} className="group-hover:-translate-x-1 transition-transform" /> Se Déconnecter</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden">
      <HomeMapModal isOpen={isMapOpen} onClose={() => setIsMapOpen(false)} />

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
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setIsMapOpen(true)}>
            <div className="w-8 h-8 border border-[#D4AF37] rounded-lg flex items-center justify-center"><Car size={16} style={{ color: GOLD }} /></div>
            <span className="text-sm font-black uppercase tracking-tighter hover:text-[#D4AF37] transition-colors">Shift</span>
          </div>
          <div className="flex items-center gap-2">
            <NotificationsPanel onNavigate={setActiveView} />
            <button onClick={() => setIsMobileMenuOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/10 text-[#D4AF37]"><Menu size={24} /></button>
          </div>
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
                      <NotificationsPanel onNavigate={setActiveView} />
                      <button onClick={loadStats} className="p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all" title="Actualiser">
                        <Activity size={18} />
                      </button>
                      <button onClick={() => setActiveView('planning')} className="flex-1 md:flex-none px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">Voir Planning</button>
                      <button onClick={() => setActiveView('fleet')} className="flex-1 md:flex-none px-8 py-4 bg-[#D4AF37] text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">Gérer Flotte</button>
                    </div>
                  </header>

                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                    <KPICard title="Chiffre d'Affaires" isLoading={isLoadingStats}
                      value={`${stats.revenue.toLocaleString('fr-FR')} €`} icon={DollarSign}
                      onClick={() => setActiveView('bookings')} />
                    <KPICard title="Taux d'Occupation" isLoading={isLoadingStats}
                      value={`${stats.occupancy}%`} icon={Activity}
                      onClick={() => setActiveView('planning')} />
                    <KPICard title="Départs Semaine" isLoading={isLoadingStats}
                      value={stats.weekDepartures.toString()} icon={Clock}
                      onClick={() => setActiveView('planning')} />
                    <KPICard title="Flotte Active" isLoading={isLoadingStats}
                      value={`${stats.fleetCount} Véhicule${stats.fleetCount > 1 ? 's' : ''}`} icon={Car}
                      onClick={() => setActiveView('fleet')} />
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                    <div className="xl:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                      <PerformanceChart dbData={chartData} isLoading={isLoadingStats} />
                    </div>
                    <div className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black uppercase tracking-tighter">Actions Urgentes</h3>
                        {stats.pendingCount > 0 && (
                          <span className="flex items-center gap-1 text-[9px] font-black bg-red-500/10 text-red-400 border border-red-500/20 px-3 py-1 rounded-full">
                            <Bell size={10} /> {stats.pendingCount} en attente
                          </span>
                        )}
                      </div>
                      <div className="space-y-4">
                        {urgentActions.map((item, i) => (
                          <motion.button key={i} whileHover={{ x: 4 }} onClick={() => setActiveView(item.view)}
                            className="w-full flex items-center gap-4 p-5 bg-white/5 rounded-2xl border border-white/5 hover:border-[#D4AF37]/30 transition-all group text-left">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.type === 'payment' ? 'bg-red-500/10 text-red-500' : item.type === 'ok' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#D4AF37]/10 text-[#D4AF37]'}`}>
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
              {activeView === 'stats' && <StatsView key="stats" />}
              {activeView === 'agency' && <AgencyProfileView key="agency" />}
              {activeView === 'settings' && <SettingsView key="settings" />}
            </AnimatePresence>
          </Suspense>
        </main>
      </div>
    </div>
  );
}

