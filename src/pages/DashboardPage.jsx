import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Car, Store, Loader2, Trash2, Plus, 
  Save, AlertCircle, CheckCircle2 
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [session, setSession] = useState(null);
  const [storeCode, setStoreCode] = useState('');
  const [fleetCount, setFleetCount] = useState(0);
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    address: '',
    store_code: ''
  });

  useEffect(() => {
    const fetchInitialData = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      setSession(session);
      const storeCode = session.user.user_metadata?.store_code;
      setStoreCode(storeCode);

      // Fetch Fleet Count
      const { count } = await supabase
        .from('fleet')
        .select('*', { count: 'exact' })
        .eq('store_code', storeCode);
      setFleetCount(count || 0);

      // Fetch Fleet
      const { data: fleetData } = await supabase
        .from('fleet')
        .select('*')
        .eq('store_code', storeCode);
      setFleet(fleetData || []);

      // Fetch Store Settings
      const { data: storeSettings } = await supabase
        .from('store_settings')
        .select('*')
        .eq('store_code', storeCode)
        .single();

      setProfile({
        first_name: storeSettings?.first_name || '',
        last_name: storeSettings?.last_name || '',
        email: session.user.email,
        phone: storeSettings?.phone || '',
        address: storeSettings?.address || '',
        store_code: storeCode
      });

      setLoading(false);
    };

    fetchInitialData();
  }, [navigate]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    navigate('/login');
  };

  const handleAddVehicle = async (vehicleData) => {
    const { error } = await supabase
      .from('fleet')
      .insert({
        ...vehicleData,
        store_code: storeCode
      });

    if (!error) {
      // Refresh fleet
      const { data } = await supabase
        .from('fleet')
        .select('*')
        .eq('store_code', storeCode);
      setFleet(data || []);
    }
  };

  const handleDeleteVehicle = async (vehicleId) => {
    const { error } = await supabase
      .from('fleet')
      .delete()
      .eq('id', vehicleId);

    if (!error) {
      // Refresh fleet
      const { data } = await supabase
        .from('fleet')
        .select('*')
        .eq('store_code', storeCode);
      setFleet(data || []);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    
    const { error } = await supabase
      .from('store_settings')
      .upsert({
        store_code: storeCode,
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        address: profile.address
      });

    if (!error) {
      localStorage.setItem('sellerProfile', JSON.stringify(profile));
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <Loader2 className="animate-spin text-zinc-700" size={40} />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-100">
      {/* Navigation */}
      <div className="flex border-b border-zinc-800">
        <button 
          onClick={() => setActiveTab('dashboard')}
          className={`p-4 flex items-center gap-2 ${activeTab === 'dashboard' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
        >
          <Store size={18} /> Tableau de Bord
        </button>
        <button 
          onClick={() => setActiveTab('fleet')}
          className={`p-4 flex items-center gap-2 ${activeTab === 'fleet' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
        >
          <Car size={18} /> Mes Voitures
        </button>
        <button 
          onClick={() => setActiveTab('settings')}
          className={`p-4 flex items-center gap-2 ${activeTab === 'settings' ? 'bg-zinc-800 text-white' : 'text-zinc-500'}`}
        >
          <Store size={18} /> Paramètres
        </button>
        <button 
          onClick={handleLogout}
          className="ml-auto p-4 text-red-500 flex items-center gap-2"
        >
          <LogOut size={18} /> Déconnexion
        </button>
      </div>

      {/* Dashboard */}
      {activeTab === 'dashboard' && (
        <div className="p-8 grid grid-cols-2 gap-6">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-6">
            <div className="flex items-center justify-between">
              <Car size={32} className="text-zinc-500" />
              <span className="text-4xl font-black">{fleetCount}</span>
            </div>
            <p className="mt-4 text-zinc-500">Véhicules en ligne</p>
          </div>
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-6">
            <div className="flex items-center justify-between">
              <Store size={32} className="text-zinc-500" />
              <span className="text-4xl font-black">{storeCode}</span>
            </div>
            <p className="mt-4 text-zinc-500">Code Boutique</p>
          </div>
        </div>
      )}

      {/* Fleet Management */}
      {activeTab === 'fleet' && (
        <div className="p-8">
          <div className="flex justify-end mb-6">
            <button 
              className="bg-white text-black px-4 py-2 rounded-full flex items-center gap-2"
              onClick={() => {/* Open Add Vehicle Modal */}}
            >
              <Plus /> Ajouter un véhicule
            </button>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {fleet.map(vehicle => (
              <div 
                key={vehicle.id} 
                className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] overflow-hidden"
              >
                <img 
                  src={vehicle.image_url} 
                  alt={vehicle.name} 
                  className="w-full h-48 object-cover"
                />
                <div className="p-4">
                  <h3 className="text-xl font-bold">{vehicle.name}</h3>
                  <p className="text-zinc-500">{vehicle.price}€ / jour</p>
                  <button 
                    onClick={() => handleDeleteVehicle(vehicle.id)}
                    className="mt-4 text-red-500 flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Supprimer
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Settings */}
      {activeTab === 'settings' && (
        <form onSubmit={handleSaveProfile} className="p-8 space-y-8">
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2.5rem] p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Prénom
                </label>
                <input 
                  type="text" 
                  value={profile.first_name} 
                  onChange={(e) => setProfile({...profile, first_name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-zinc-500 outline-none font-bold" 
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                  Nom
                </label>
                <input 
                  type="text" 
                  value={profile.last_name} 
                  onChange={(e) => setProfile({...profile, last_name: e.target.value})}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-zinc-500 outline-none font-bold" 
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Email
              </label>
              <input 
                type="email" 
                value={profile.email} 
                readOnly
                className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl py-4 px-5 text-zinc-400 cursor-not-allowed" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Téléphone
              </label>
              <input 
                type="tel" 
                value={profile.phone} 
                onChange={(e) => setProfile({...profile, phone: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-zinc-500 outline-none font-bold" 
                placeholder="+33 6 12 34 56 78"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Adresse Postale
              </label>
              <input 
                type="text" 
                value={profile.address} 
                onChange={(e) => setProfile({...profile, address: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-zinc-500 outline-none font-bold" 
                placeholder="123 Rue de l'Entreprise, 75001 Paris"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black text-zinc-500 uppercase tracking-widest ml-1">
                Code Boutique
              </label>
              <input 
                type="text" 
                value={profile.store_code} 
                onChange={(e) => setProfile({...profile, store_code: e.target.value})}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl py-4 px-5 text-white focus:border-zinc-500 outline-none font-bold" 
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button 
              type="submit" 
              className="bg-zinc-100 text-zinc-950 px-8 py-4 rounded-[2rem] font-black hover:bg-white transition-all flex items-center gap-3 uppercase tracking-widest text-sm shadow-xl"
            >
              <Save size={20} />
              Enregistrer les modifications
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
