import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { 
  MapPin, Loader2, ArrowRight, X, AlertCircle, CheckCircle2, Car,
  Fuel, Gauge, Users2, ShieldCheck
} from 'lucide-react';

export default function ShopPage() {
  const { storeCode } = useParams();
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [bookingDates, setBookingDates] = useState({ start: '', end: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function fetchFleet() {
      setLoading(true);
      const { data } = await supabase
        .from('fleet')
        .select('*')
        .ilike('store_code', storeCode)
        .eq('availability_status', 'disponible');
      setVehicles(data || []);
      setLoading(false);
    }
    fetchFleet();
  }, [storeCode]);

  if (loading) return <div className="min-h-screen bg-zinc-950 flex items-center justify-center"><Loader2 className="animate-spin text-zinc-100" size={40} /></div>;

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <nav className="border-b border-zinc-900 bg-zinc-950/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center text-zinc-950 font-black text-2xl">
              {storeCode?.charAt(0).toUpperCase()}
            </div>
            <h1 className="font-black text-xl uppercase tracking-tight">Agence {storeCode}</h1>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {vehicles.map(vehicle => (
            <div key={vehicle.id} className="bg-zinc-900 border border-zinc-800 rounded-[2.5rem] overflow-hidden flex flex-col group">
              <div className="relative h-64 overflow-hidden">
                <img src={vehicle.image_url} className="w-full h-full object-cover" alt={vehicle.name} />
                <div className="absolute bottom-4 left-4 bg-white text-zinc-950 px-4 py-2 rounded-xl font-black">
                  {vehicle.price}€ <span className="text-[10px] text-zinc-500">/ JOUR</span>
                </div>
              </div>
              <div className="p-8 flex-1 flex flex-col space-y-6">
                <div>
                  <h3 className="text-2xl font-black uppercase mb-2">{vehicle.name}</h3>
                  <p className="text-zinc-500 text-xs font-medium line-clamp-2 italic">"{vehicle.description}"</p>
                </div>

                <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                  <div className="flex items-center gap-3">
                    <Fuel size={18} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase">{vehicle.fuel_type}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Gauge size={18} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase">{vehicle.transmission}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users2 size={18} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase">{vehicle.seats_count} Places</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <ShieldCheck size={18} className="text-zinc-500" />
                    <span className="text-[10px] font-black uppercase">{vehicle.security_deposit}€ Caution</span>
                  </div>
                </div>

                <button 
                  onClick={() => setSelectedVehicle(vehicle)}
                  className="w-full py-4 bg-zinc-100 text-zinc-950 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-white transition-all mt-auto flex items-center justify-center gap-2"
                >
                  RÉSERVER MAINTENANT <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
