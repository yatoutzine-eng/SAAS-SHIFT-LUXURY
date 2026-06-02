import React, { useEffect, useState, Suspense } from 'react';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuthPortal from './pages/AuthPortal';
import HomePage from './pages/HomePage';
import ClientHome from './pages/ClientHome';
import ClientAccount from './pages/ClientAccount';
import { useTheme } from './hooks/useTheme';
import { useAuthStore } from './store/useAuthStore';

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Initialisation Shift</p>
    </div>
  </div>
);

export default function App() {
  const { theme } = useTheme();
  const { user, role, isLoading, initSession, logout } = useAuthStore();

  // Navigation state — pas de localStorage pour ça
  const [clientView, setClientView] = useState('home'); // 'home' | 'account' | 'store'
  const [selectedStore, setSelectedStore] = useState(() => {
    const saved = localStorage.getItem('shift_selected_store');
    return saved ? JSON.parse(saved) : null;
  });

  const wantsAuth = localStorage.getItem('shift_go_auth');

  useEffect(() => { initSession(); }, []);

  // Si on revenait d'une boutique, reprendre là où on était
  useEffect(() => {
    if (user && localStorage.getItem('shift_viewing_store') && selectedStore) {
      setClientView('store');
    }
  }, [user]);

  if (isLoading) return <LoadingFallback />;

  const handleEnterStore = (storeSettings) => {
    localStorage.setItem('shift_selected_store', JSON.stringify(storeSettings));
    localStorage.setItem('shift_viewing_store', 'true');
    setSelectedStore(storeSettings);
    setClientView('store');
  };

  const handleGoToAuth = () => {
    localStorage.setItem('shift_go_auth', 'true');
    window.location.reload();
  };

  const handleLeaveStore = () => {
    localStorage.removeItem('shift_viewing_store');
    setClientView('home');
  };

  const renderView = () => {

    // ── UTILISATEUR CONNECTÉ ──
    if (user) {
      localStorage.removeItem('shift_go_auth');

      if (role === 'merchant') return <AdminDashboard onLogout={logout} />;

      // Vue compte perso
      if (clientView === 'account') {
        return (
          <ClientAccount
            onBack={() => setClientView('home')}
          />
        );
      }

      // Vue showroom boutique
      if (clientView === 'store' && selectedStore) {
        const StorefrontClient = React.lazy(() => import('./pages/client/Storefront'));
        return (
          <Suspense fallback={<LoadingFallback />}>
            <StorefrontClient
              onLogout={logout}
              onLeave={handleLeaveStore}
            />
          </Suspense>
        );
      }

      // Accueil client avec map
      return (
        <ClientHome
          onEnterStore={handleEnterStore}
          onGoToAccount={() => setClientView('account')}
        />
      );
    }

    // ── PAS CONNECTÉ ──
    if (wantsAuth || localStorage.getItem('shift_viewing_store')) {
      return (
        <AuthPortal onBack={() => {
          localStorage.removeItem('shift_go_auth');
          localStorage.removeItem('shift_viewing_store');
          window.location.reload();
        }} />
      );
    }

    return (
      <HomePage
        onEnterStore={(store) => {
          localStorage.setItem('shift_selected_store', JSON.stringify(store));
          localStorage.setItem('shift_viewing_store', 'true');
          localStorage.setItem('shift_go_auth', 'true');
          window.location.reload();
        }}
        onGoToAuth={handleGoToAuth}
      />
    );
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-black text-white' : 'bg-white text-black'}`}>
      <Suspense fallback={<LoadingFallback />}>
        {renderView()}
      </Suspense>
    </div>
  );
}
