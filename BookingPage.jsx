import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, X, CheckCircle2, 
  PenTool, Camera, Flag, ShieldCheck,
  Clock, CheckCircle, AlertCircle,
  Zap
} from 'lucide-react';
import ContractModal from '../../components/admin/ContractModal';
import InspectionModal from '../../components/admin/InspectionModal';
import CheckoutModal from '../../components/admin/CheckoutModal';

const GOLD = "#D4AF37";

export default function ReservationsView() {
  const [filter, setFilter] = useState('Toutes');
  const [reservations, setReservations] = useState([]);
  const [contractRes, setContractRes] = useState(null);
  const [inspectionRes, setInspectionRes] = useState(null);
  const [checkoutRes, setCheckoutRes] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('SHIFT_RESERVATIONS');
    if (saved) {
      setReservations(JSON.parse(saved));
    } else {
      const initial = [
        {
          id: 'RES-8829',
          client: { name: 'Jean-Baptiste L.', avatar: 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=100' },
          vehicle: 'Ferrari F8 Tributo',
          dates: '12/10 - 15/10',
          status: 'Confirmé',
          amount: '4,500€',
          days: 3
        },
        {
          id: 'RES-9012',
          client: { name: 'Sophie Valery', avatar: 'https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=100' },
          vehicle: 'Lamborghini Huracán',
          dates: '18/10 - 20/10',
          status: 'Confirmé',
          amount: '3,200€',
          days: 2
        }
      ];
      setReservations(initial);
      localStorage.setItem('SHIFT_RESERVATIONS', JSON.stringify(initial));
    }
  }, []);

  const updateReservation = (id, updates) => {
    const newData = reservations.map(res => res.id === id ? { ...res, ...updates } : res);
    setReservations(newData);
    localStorage.setItem('SHIFT_RESERVATIONS', JSON.stringify(newData));
  };

  // --- HANDLERS DE TRANSITION D'ÉTAT ---

  const handleSignContract = (signatureData) => {
    // Transition: CONFIRMÉ -> SIGNÉ & CONFIRMÉ
    updateReservation(contractRes.id, { 
      status: 'SIGNÉ & CONFIRMÉ', 
      contractSignature: signatureData,
      signedAt: new Date().toISOString()
    });
    setContractRes(null);
  };

  const handleInspectionComplete = (photos) => {
    // Transition: SIGNÉ & CONFIRMÉ -> VÉHICULE RÉCUPÉRÉ
    updateReservation(inspectionRes.id, { 
      status: 'VÉHICULE RÉCUPÉRÉ', 
      inspectionPhotos: photos,
      checkInDate: new Date().toISOString()
    });
    setInspectionRes(null);
  };

  const handleCheckoutComplete = (checkoutData) => {
    // Transition: VÉHICULE RÉCUPÉRÉ -> TERMINÉ
    updateReservation(checkoutRes.id, { 
      status: 'TERMINÉ', 
      checkoutData,
      completedAt: new Date().toISOString()
    });
    
    // Libération automatique du véhicule dans la flotte
    const fleet = JSON.parse(localStorage.getItem('SHIFT_FLEET_DATA') || '[]');
    const updatedFleet = fleet.map(v => v.model === checkoutRes.vehicle ? { ...v, status: 'DISPONIBLE' } : v);
    localStorage.setItem('SHIFT_FLEET_DATA', JSON.stringify(updatedFleet));
    window.dispatchEvent(new Event('storage'));

    setCheckoutRes(null);
  };

  // --- BOUTON DE SECOURS / TEST ---
  const simulateRecovery = (id) => {
    updateReservation(id, { status: 'VÉHICULE RÉCUPÉRÉ' });
  };

  const filteredData = reservations.filter(res => filter === 'Toutes' || res.status === filter);

  // --- LOGIQUE DE RENDU DES ACTIONS ---

  const renderActionButtons = (res) => {
    switch (res.status) {
      case 'EN ATTENTE':
      case 'Confirmé':
        return (
          <div className="flex items-center gap-2">
            <button 
              onClick={() => simulateRecovery(res.id)}
              className="p-2 bg-white/5 text-zinc-600 hover:text-amber-500 rounded-lg transition-colors"
              title="Simuler Récupération (Test)"
            >
              <Zap size={14} />
            </button>
            <button 
              onClick={() => setContractRes(res)}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#D4AF37]/20"
            >
              <PenTool size={14} /> 📜 Contrat
            </button>
          </div>
        );
      
      case 'SIGNÉ & CONFIRMÉ':
        return (
          <button 
            onClick={() => setInspectionRes(res)}
            className="flex items-center gap-2 px-5 py-2.5 bg-white text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-white/10"
          >
            <ShieldCheck size={14} /> 🛡️ Check-in
          </button>
        );

      case 'VÉHICULE RÉCUPÉRÉ':
        return (
          <button 
            onClick={() => setCheckoutRes(res)}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#D4AF37] text-black rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-lg shadow-[#D4AF37]/30"
          >
            <Flag size={14} /> 🏁 Retour
          </button>
        );

      case 'TERMINÉ':
        return (
          <div className="flex items-center gap-2 text-zinc-500">
            <CheckCircle size={14} className="text-emerald-500" />
            <span className="text-[9px] font-black uppercase tracking-widest">Clôturé</span>
            <button className="ml-2 p-2 bg-white/5 rounded-lg hover:text-white transition-colors">
              <FileText size={14} />
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-4xl font-black uppercase tracking-tighter mb-2">Réservations</h2>
          <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest">Cycle de vie opérationnel</p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-900/50 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {['Toutes', 'Confirmé', 'SIGNÉ & CONFIRMÉ', 'VÉHICULE RÉCUPÉRÉ', 'TERMINÉ'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`whitespace-nowrap px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-[#D4AF37] text-black shadow-lg shadow-[#D4AF37]/20' : 'text-zinc-500 hover:text-white'}`}>
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-zinc-950/50 border border-white/5 rounded-[2.5rem] overflow-hidden backdrop-blur-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5">
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Client</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Véhicule</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Statut</th>
              <th className="px-8 py-6 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.02]">
            {filteredData.map((res) => (
              <tr key={res.id} className="group hover:bg-white/[0.02] transition-colors">
                <td className="px-8 py-6">
                  <div className="flex items-center gap-4">
                    <img src={res.client.avatar} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                    <div>
                      <div className="text-sm font-bold text-white">{res.client.name}</div>
                      <div className="text-[9px] text-zinc-600 font-black uppercase tracking-widest">{res.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-6 text-sm text-zinc-300">{res.vehicle}</td>
                <td className="px-8 py-6">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border flex items-center gap-2 w-fit ${
                    res.status === 'TERMINÉ'
                      ? 'bg-zinc-800 text-zinc-400 border-white/10'
                      : res.status === 'VÉHICULE RÉCUPÉRÉ'
                        ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        : res.status === 'SIGNÉ & CONFIRMÉ' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                          : 'bg-[#D4AF37]/10 text-[#D4AF37] border-[#D4AF37]/20'
                  }`}>
                    <div className={`w-1 h-1 rounded-full animate-pulse ${
                      res.status === 'TERMINÉ' ? 'bg-zinc-500' : 
                      res.status === 'VÉHICULE RÉCUPÉRÉ' ? 'bg-blue-400' :
                      res.status === 'SIGNÉ & CONFIRMÉ' ? 'bg-emerald-400' : 'bg-[#D4AF37]'
                    }`} />
                    {res.status}
                  </span>
                </td>
                <td className="px-8 py-6">
                  <div className="flex items-center justify-end">
                    {renderActionButtons(res)}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {contractRes && (
          <ContractModal 
            reservation={contractRes} 
            onClose={() => setContractRes(null)}
            onSign={handleSignContract}
          />
        )}
        {inspectionRes && (
          <InspectionModal 
            reservation={inspectionRes}
            onClose={() => setInspectionRes(null)}
            onComplete={handleInspectionComplete}
          />
        )}
        {checkoutRes && (
          <CheckoutModal 
            reservation={checkoutRes}
            onClose={() => setCheckoutRes(null)}
            onComplete={handleCheckoutComplete}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
