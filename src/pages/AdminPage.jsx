import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Trash2, X, Loader2
} from 'lucide-react';

export default function AdminPage({ onLogout }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('fleet');
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState('');
  
  // Fleet Management States
  const [vehicles, setVehicles] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetError, setFleetError] = useState(null);
  const [isAddingVehicle, setIsAddingVehicle] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    name: '', 
    price: '', 
    image_url: '', 
    fuel: 'Électrique', 
    seats: 5, 
    security_deposit: 500
  });

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const userRole = session.user.user_metadata?.role;
      const storeCode = session.user.user_metadata?.store_code;
      
      if (userRole !== 'vendor') {
        navigate('/');
        return;
      }

      setRole(userRole);
      setUserEmail(session.user.email || '');
      setLoading(false);
      return storeCode;
    } catch (error) {
      console.error('Error checking user role:', error);
      setLoading(false);
      navigate('/login');
    }
  };

  const fetchVehicles = async () => {
    const storeCode = await checkUserRole();
    if (!storeCode) return;

    setFleetLoading(true);
    try {
      const { data, error } = await supabase
        .from('fleet')
        .select('*')
        .eq('store_code', storeCode)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setVehicles(data || []);
    } catch (err) {
      console.error("Erreur de chargement des véhicules:", err);
      setFleetError(err.message);
    } finally { 
      setFleetLoading(false); 
    }
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    const storeCode = await checkUserRole();
    if (!storeCode) return;

    try {
      const { data, error } = await supabase
        .from('fleet')
        .insert({
          ...newVehicle,
          store_code: storeCode
        })
        .select();

      if (error) throw error;

      // Reset form and update vehicles
      setNewVehicle({
        name: '', 
        price: '', 
        image_url: '', 
        fuel: 'Électrique', 
        seats: 5, 
        security_deposit: 500
      });
      setIsAddingVehicle(false);
      fetchVehicles();
    } catch (err) {
      console.error("Erreur d'ajout de véhicule:", err);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    try {
      const { error } = await supabase
        .from('fleet')
        .delete()
        .eq('id', vehicleId);

      if (error) throw error;
      fetchVehicles();
    } catch (err) {
      console.error("Erreur de suppression de véhicule:", err);
    }
  };

  useEffect(() => {
    fetchVehicles();
  }, []);

  const renderFleetTab = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-zinc-100">Ma Flotte</h2>
        <button 
          onClick={() => setIsAddingVehicle(true)}
          className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-emerald-500/20 transition-all"
        >
          <Plus className="w-5 h-5" />
          Ajouter un véhicule
        </button>
      </div>

      {isAddingVehicle && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <form 
            onSubmit={handleAddVehicle}
            className="bg-zinc-900 p-8 rounded-2xl w-full max-w-md space-y-4"
          >
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-bold text-zinc-100">Nouveau Véhicule</h3>
              <button 
                type="button"
                onClick={() => setIsAddingVehicle(false)}
                className="text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-3">
              <input 
                type="text" 
                placeholder="Nom du modèle" 
                value={newVehicle.name}
                onChange={(e) => setNewVehicle({...newVehicle, name: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                required 
              />
              <input 
                type="number" 
                placeholder="Prix/jour" 
                value={newVehicle.price}
                onChange={(e) => setNewVehicle({...newVehicle, price: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                required 
              />
              <input 
                type="text" 
                placeholder="URL de l'image" 
                value={newVehicle.image_url}
                onChange={(e) => setNewVehicle({...newVehicle, image_url: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                required 
              />
              <select
                value={newVehicle.fuel}
                onChange={(e) => setNewVehicle({...newVehicle, fuel: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
              >
                <option value="Électrique">Électrique</option>
                <option value="Essence">Essence</option>
                <option value="Diesel">Diesel</option>
                <option value="Hybride">Hybride</option>
              </select>
              <input 
                type="number" 
                placeholder="Nombre de places" 
                value={newVehicle.seats}
                onChange={(e) => setNewVehicle({...newVehicle, seats: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                required 
              />
              <input 
                type="number" 
                placeholder="Caution" 
                value={newVehicle.security_deposit}
                onChange={(e) => setNewVehicle({...newVehicle, security_deposit: e.target.value})}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-100"
                required 
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-4 py-2 rounded-lg hover:bg-emerald-500/20 transition-all"
            >
              Ajouter le véhicule
            </button>
          </form>
        </div>
      )}

      {fleetLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-zinc-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles.map((vehicle) => (
            <div 
              key={vehicle.id} 
              className="bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 shadow-lg"
            >
              <img 
                src={vehicle.image_url} 
                alt={vehicle.name} 
                className="w-full h-48 object-cover"
              />
              <div className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-bold text-zinc-100">{vehicle.name}</h3>
                  <button 
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="text-red-500 hover:bg-red-500/10 p-2 rounded-full transition-all"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-zinc-400">{vehicle.price}€/jour</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-0 bg-[#09090b]">
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        {activeTab === 'fleet' && renderFleetTab()}
      </main>
    </div>
  );
}
