import React, { useState, useEffect, useMemo } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, Car, DollarSign, Calendar, Award, BarChart2,
  ArrowUpRight, ArrowDownRight, Activity, Clock, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";
const fmt = (n) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
const fmtShort = (n) => n >= 1000 ? `${(n / 1000).toFixed(1)}k€` : `${n}€`;

// ─── Tooltip personnalisé ───────────────────────────────────────────────────
const GoldTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/95 border border-[#D4AF37]/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">{label}</p>
        <p className="text-lg font-black text-[#D4AF37]">{fmt(payload[0].value)}</p>
      </div>
    );
  }
  return null;
};

// ─── Mini stat card ─────────────────────────────────────────────────────────
const StatCard = ({ title, value, sub, icon: Icon, trend, color = GOLD, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className="bg-zinc-900/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden group hover:border-[#D4AF37]/30 transition-all"
  >
    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
      <Icon size={70} />
    </div>
    <div className="flex items-start justify-between mb-4">
      <div className="w-11 h-11 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <Icon size={18} style={{ color }} />
      </div>
      {trend !== undefined && (
        <span className={`flex items-center gap-1 text-[10px] font-black px-3 py-1 rounded-full ${trend >= 0 ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'}`}>
          {trend >= 0 ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
          {Math.abs(trend)}%
        </span>
      )}
    </div>
    <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest mb-1">{title}</p>
    <h3 className="text-2xl font-black tracking-tighter">{value}</h3>
    {sub && <p className="text-zinc-600 text-[10px] font-bold uppercase tracking-wider mt-1">{sub}</p>}
  </motion.div>
);

// ─── Barre de progression véhicule ──────────────────────────────────────────
const VehicleBar = ({ model, revenue, maxRevenue, bookings, rank, delay }) => {
  const pct = maxRevenue > 0 ? (revenue / maxRevenue) * 100 : 0;
  const medals = ['🥇', '🥈', '🥉'];
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="group"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className="text-lg w-6 text-center">{medals[rank] || `#${rank + 1}`}</span>
          <div>
            <p className="text-[11px] font-black uppercase tracking-wider text-white group-hover:text-[#D4AF37] transition-colors">{model || 'Véhicule'}</p>
            <p className="text-[9px] text-zinc-600 font-bold uppercase">{bookings} location{bookings > 1 ? 's' : ''}</p>
          </div>
        </div>
        <span className="text-[#D4AF37] font-black text-sm tracking-tight">{fmt(revenue)}</span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ delay: delay + 0.2, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${GOLD}99, ${GOLD})` }}
        />
      </div>
    </motion.div>
  );
};

// ─── COMPOSANT PRINCIPAL ────────────────────────────────────────────────────
export default function StatsView() {
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState('month'); // week | month | year
  const [data, setData] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    avgDuration: 0,
    occupancyRate: 0,
    revenueChart: [],
    vehicleStats: [],
    monthlyRevenue: [],
    statusBreakdown: [],
    topMonth: null,
    revenueVsPrevious: null,
  });

  useEffect(() => { loadStats(); }, [period]);

  const loadStats = async () => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── Flotte ──────────────────────────────────────────
      const { data: fleet } = await supabase
        .from('fleet')
        .select('*')
        .eq('user_id', user.id);
      const fleetCount = fleet?.length || 0;
      const rentedCount = fleet?.filter(v => v.status === 'rented').length || 0;
      const occupancyRate = fleetCount > 0 ? Math.round((rentedCount / fleetCount) * 100) : 0;

      // ── Réservations ─────────────────────────────────────
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, fleet(model, brand)')
        .eq('merchant_id', user.id)
        .neq('status', 'cancelled');

      const all = bookings || [];

      // Filtre par période
      const now = new Date();
      const filtered = all.filter(b => {
        const d = new Date(b.start_date);
        if (period === 'week') {
          const weekAgo = new Date(now); weekAgo.setDate(now.getDate() - 7);
          return d >= weekAgo;
        }
        if (period === 'month') {
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        }
        if (period === 'year') {
          return d.getFullYear() === now.getFullYear();
        }
        return true;
      });

      const paidStatuses = ['completed', 'in_progress', 'signed', 'confirmed'];
      const revenue = filtered
        .filter(b => paidStatuses.includes(b.status))
        .reduce((s, b) => s + (b.total_price || 0), 0);

      // ── Durée moyenne ─────────────────────────────────────
      const durations = filtered.map(b => {
        const s = new Date(b.start_date), e = new Date(b.end_date);
        return Math.max(1, Math.round((e - s) / 86400000));
      });
      const avgDuration = durations.length > 0
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
        : 0;

      // ── Graphique revenus (7 ou 30 derniers jours) ───────
      const chartDays = period === 'week' ? 7 : period === 'month' ? 30 : 12;
      let revenueChart = [];
      if (period === 'year') {
        // par mois
        revenueChart = Array.from({ length: 12 }, (_, i) => {
          const month = new Date(now.getFullYear(), i, 1);
          const label = month.toLocaleDateString('fr-FR', { month: 'short' });
          const total = all
            .filter(b => {
              const d = new Date(b.start_date);
              return d.getMonth() === i && d.getFullYear() === now.getFullYear() && paidStatuses.includes(b.status);
            })
            .reduce((s, b) => s + (b.total_price || 0), 0);
          return { name: label, total };
        });
      } else {
        revenueChart = Array.from({ length: chartDays }, (_, i) => {
          const d = new Date(now);
          d.setDate(now.getDate() - (chartDays - 1 - i));
          const dayStr = d.toISOString().split('T')[0];
          const label = period === 'week'
            ? d.toLocaleDateString('fr-FR', { weekday: 'short' })
            : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
          const total = all
            .filter(b => b.start_date === dayStr && paidStatuses.includes(b.status))
            .reduce((s, b) => s + (b.total_price || 0), 0);
          return { name: label, total };
        });
      }

      // ── Stats par véhicule ───────────────────────────────
      const vehicleMap = {};
      all.forEach(b => {
        const key = b.vehicle_id || b.fleet?.model || 'unknown';
        const model = b.fleet?.model || b.vehicle_model || 'Véhicule';
        if (!vehicleMap[key]) vehicleMap[key] = { model, revenue: 0, bookings: 0 };
        if (paidStatuses.includes(b.status)) vehicleMap[key].revenue += b.total_price || 0;
        vehicleMap[key].bookings++;
      });
      const vehicleStats = Object.values(vehicleMap)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5);

      // ── Répartition statuts ──────────────────────────────
      const statusLabels = {
        pending: 'En attente',
        confirmed: 'Confirmé',
        in_progress: 'En cours',
        completed: 'Terminé',
        signed: 'Signé',
      };
      const statusColors = {
        pending: '#F59E0B',
        confirmed: '#3B82F6',
        in_progress: GOLD,
        completed: '#10B981',
        signed: '#8B5CF6',
      };
      const statusMap = {};
      all.forEach(b => {
        const s = b.status;
        if (!statusMap[s]) statusMap[s] = 0;
        statusMap[s]++;
      });
      const statusBreakdown = Object.entries(statusMap).map(([key, count]) => ({
        name: statusLabels[key] || key,
        count,
        color: statusColors[key] || '#666',
      })).sort((a, b) => b.count - a.count);

      // ── Revenue vs période précédente ────────────────────
      let prevRevenue = 0;
      const prevFiltered = all.filter(b => {
        const d = new Date(b.start_date);
        if (period === 'week') {
          const start = new Date(now); start.setDate(now.getDate() - 14);
          const end = new Date(now); end.setDate(now.getDate() - 7);
          return d >= start && d < end;
        }
        if (period === 'month') {
          const prev = new Date(now); prev.setMonth(now.getMonth() - 1);
          return d.getMonth() === prev.getMonth() && d.getFullYear() === prev.getFullYear();
        }
        if (period === 'year') {
          return d.getFullYear() === now.getFullYear() - 1;
        }
        return false;
      });
      prevRevenue = prevFiltered
        .filter(b => paidStatuses.includes(b.status))
        .reduce((s, b) => s + (b.total_price || 0), 0);
      const revenueVsPrevious = prevRevenue > 0
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 100)
        : null;

      // ── Meilleur mois ────────────────────────────────────
      const monthlyMap = {};
      all.forEach(b => {
        if (!paidStatuses.includes(b.status)) return;
        const d = new Date(b.start_date);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        const label = d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
        if (!monthlyMap[key]) monthlyMap[key] = { label, revenue: 0 };
        monthlyMap[key].revenue += b.total_price || 0;
      });
      const topMonth = Object.values(monthlyMap).sort((a, b) => b.revenue - a.revenue)[0] || null;

      setData({
        totalRevenue: revenue,
        totalBookings: filtered.length,
        avgDuration,
        occupancyRate,
        revenueChart,
        vehicleStats,
        statusBreakdown,
        topMonth,
        revenueVsPrevious,
      });
    } catch (err) {
      console.error('Stats error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const periodLabel = { week: '7 derniers jours', month: 'Ce mois', year: 'Cette année' };
  const maxVehicleRevenue = data.vehicleStats[0]?.revenue || 1;

  return (
    <motion.div
      key="stats"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-10"
    >
      {/* ── En-tête ── */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-4xl lg:text-5xl font-black uppercase tracking-tighter mb-2">
            Statistiques <span style={{ color: GOLD }}>Réelles</span>
          </h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">
            Analyse de performance — {periodLabel[period]}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Sélecteur de période */}
          <div className="flex bg-zinc-900/60 border border-white/5 rounded-2xl p-1 gap-1">
            {[['week', '7J'], ['month', '1M'], ['year', '1A']].map(([val, label]) => (
              <button
                key={val}
                onClick={() => setPeriod(val)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${period === val ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-zinc-500 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={loadStats}
            className={`p-3.5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all ${isLoading ? 'animate-spin' : ''}`}
            title="Actualiser"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      {/* ── KPI Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        <StatCard title="Chiffre d'Affaires" value={isLoading ? '—' : fmt(data.totalRevenue)}
          icon={DollarSign} trend={data.revenueVsPrevious} delay={0} />
        <StatCard title="Réservations" value={isLoading ? '—' : data.totalBookings.toString()}
          sub={periodLabel[period]} icon={Calendar} delay={0.07} />
        <StatCard title="Durée Moyenne" value={isLoading ? '—' : `${data.avgDuration} j`}
          sub="par location" icon={Clock} delay={0.14} />
        <StatCard title="Taux d'Occupation" value={isLoading ? '—' : `${data.occupancyRate}%`}
          sub="flotte active" icon={Activity} delay={0.21} />
      </div>

      {/* ── Graphique revenus + Meilleur mois ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.5 }}
          className="xl:col-span-2 bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <TrendingUp size={18} style={{ color: GOLD }} />
              </div>
              <div>
                <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Évolution des Revenus</h3>
                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">
                  {isLoading ? 'Chargement...' : data.totalRevenue > 0 ? 'Données réelles' : 'Aucune donnée'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total</p>
              <p className="text-xl font-black tracking-tighter">{fmt(data.totalRevenue)}</p>
            </div>
          </div>
          <div className="h-[260px] relative">
            {isLoading && (
              <div className="absolute inset-0 z-10 flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="statsGold" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={GOLD} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={GOLD} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} dy={12}
                  interval={period === 'month' ? 4 : 0}
                />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={fmtShort}
                />
                <Tooltip content={<GoldTooltip />} cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: '5 5' }} />
                <Area type="monotone" dataKey="total" stroke={GOLD} strokeWidth={3}
                  fillOpacity={1} fill="url(#statsGold)" animationDuration={1200} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Meilleur mois + statuts */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.5 }}
          className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col gap-8"
        >
          {/* Meilleur mois */}
          <div>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
                <Award size={18} style={{ color: GOLD }} />
              </div>
              <h3 className="text-base font-black uppercase tracking-tighter">Meilleur Mois</h3>
            </div>
            {data.topMonth ? (
              <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-2xl p-5">
                <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1 capitalize">{data.topMonth.label}</p>
                <p className="text-3xl font-black tracking-tighter" style={{ color: GOLD }}>{fmt(data.topMonth.revenue)}</p>
              </div>
            ) : (
              <p className="text-zinc-600 text-xs font-bold uppercase">Pas encore de données</p>
            )}
          </div>

          {/* Répartition statuts */}
          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                <BarChart2 size={18} className="text-zinc-400" />
              </div>
              <h3 className="text-base font-black uppercase tracking-tighter">Répartition</h3>
            </div>
            <div className="space-y-3">
              {data.statusBreakdown.length > 0 ? data.statusBreakdown.map((s, i) => {
                const total = data.statusBreakdown.reduce((a, b) => a + b.count, 0);
                const pct = Math.round((s.count / total) * 100);
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400">{s.name}</span>
                      <span className="text-[10px] font-black text-zinc-500">{s.count} ({pct}%)</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.1, duration: 0.6 }}
                        className="h-full rounded-full"
                        style={{ backgroundColor: s.color }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-zinc-600 text-xs font-bold uppercase">Aucune réservation</p>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Revenus par véhicule ── */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.42, duration: 0.5 }}
        className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
            <Car size={18} style={{ color: GOLD }} />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Revenus par Véhicule</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">Classement de rentabilité</p>
          </div>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between">
                  <div className="h-3 w-32 bg-zinc-800 rounded-lg animate-pulse" />
                  <div className="h-3 w-16 bg-zinc-800 rounded-lg animate-pulse" />
                </div>
                <div className="h-2 bg-zinc-800 rounded-full animate-pulse" />
              </div>
            ))}
          </div>
        ) : data.vehicleStats.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-7">
            {data.vehicleStats.map((v, i) => (
              <VehicleBar key={i} {...v} maxRevenue={maxVehicleRevenue} rank={i} delay={0.5 + i * 0.08} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Car size={40} className="text-zinc-700 mb-4" />
            <p className="text-zinc-500 text-sm font-black uppercase tracking-widest">Aucune donnée de revenus</p>
            <p className="text-zinc-700 text-xs font-bold uppercase mt-1">Les stats apparaîtront dès les premières réservations confirmées</p>
          </div>
        )}
      </motion.div>

      {/* ── Bar chart mensuel (si année sélectionnée) ── */}
      {period === 'year' && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="bg-zinc-900/20 border border-white/5 rounded-[2.5rem] p-8 lg:p-10"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center">
              <BarChart2 size={18} style={{ color: GOLD }} />
            </div>
            <div>
              <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Revenus Mensuels</h3>
              <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-0.5">{new Date().getFullYear()}</p>
            </div>
          </div>
          <div className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.revenueChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
                  tickFormatter={fmtShort} />
                <Tooltip content={<GoldTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                <Bar dataKey="total" radius={[8, 8, 0, 0]}>
                  {data.revenueChart.map((entry, index) => (
                    <Cell key={index} fill={entry.total > 0 ? GOLD : 'rgba(255,255,255,0.05)'} fillOpacity={entry.total > 0 ? 0.85 : 1} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}

