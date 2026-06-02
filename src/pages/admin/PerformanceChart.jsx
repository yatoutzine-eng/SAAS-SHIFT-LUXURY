import React, { useMemo } from 'react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { TrendingUp } from 'lucide-react';

const GOLD = "#D4AF37";

// Données de prestige (Fallback)
const DUMMY_DATA = [
  { name: 'Lun', total: 2400 },
  { name: 'Mar', total: 3200 },
  { name: 'Mer', total: 2800 },
  { name: 'Jeu', total: 4500 },
  { name: 'Ven', total: 3800 },
  { name: 'Sam', total: 5900 },
  { name: 'Dim', total: 5200 },
];

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-black/90 border border-[#D4AF37]/30 backdrop-blur-xl p-4 rounded-2xl shadow-2xl">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mb-1">Revenus du jour</p>
        <p className="text-xl font-black text-[#D4AF37]">
          {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(payload[0].value)}
        </p>
      </div>
    );
  }
  return null;
};

export default function PerformanceChart({ dbData, isLoading }) {
  const chartData = useMemo(() => {
    if (dbData && dbData.length > 0) return dbData;
    return DUMMY_DATA;
  }, [dbData]);

  const isDemoMode = !dbData || dbData.length === 0;

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/10 flex items-center justify-center border border-[#D4AF37]/20">
            <TrendingUp size={20} className="text-[#D4AF37]" />
          </div>
          <div>
            <h3 className="text-lg font-black uppercase tracking-tighter leading-none">Flux de Trésorerie</h3>
            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-[0.2em] mt-1">
              {isDemoMode ? "Mode Démonstration" : "Données réelles"}
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Total Semaine</p>
          <p className="text-xl font-black text-white tracking-tighter">
            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(
              chartData.reduce((acc, curr) => acc + curr.total, 0)
            )}
          </p>
        </div>
      </div>

      <div className="flex-1 min-h-[280px] w-full relative">
        {isLoading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/20 backdrop-blur-[2px] rounded-3xl">
            <div className="w-8 h-8 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={chartData}
            margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
          >
            {/* Utilisation de la balise SVG standard <defs> au lieu du composant inexistant <Defs> */}
            <defs>
              <linearGradient id="colorGold" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={GOLD} stopOpacity={0.4}/>
                <stop offset="95%" stopColor={GOLD} stopOpacity={0}/>
              </linearGradient>
            </defs>
            
            <CartesianGrid 
              strokeDasharray="3 3" 
              vertical={false} 
              stroke="rgba(255,255,255,0.03)" 
            />
            
            <XAxis 
              dataKey="name" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
              dy={15}
            />
            
            <YAxis 
              axisLine={false} 
              tickLine={false} 
              tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: 900 }}
              tickFormatter={(value) => `${value}€`}
            />
            
            <Tooltip content={<CustomTooltip />} cursor={{ stroke: GOLD, strokeWidth: 1, strokeDasharray: '5 5' }} />
            
            <Area
              type="monotone"
              dataKey="total"
              stroke={GOLD}
              strokeWidth={4}
              fillOpacity={1}
              fill="url(#colorGold)"
              isAnimationActive={true}
              animationDuration={1500}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
