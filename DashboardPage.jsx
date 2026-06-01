import React, { useEffect, Suspense } from 'react';
import AdminDashboard from './pages/admin/AdminDashboard';
import Storefront from './pages/client/Storefront';
import AuthPortal from './pages/AuthPortal';
import HomePage from './pages/HomePage';
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

  useEffect(() => {
    initSession();
  }, []);

  if (isLoading) return <LoadingFallback />;

  const handleEnterStore = (storeSettings) => {
    // Stocke le store_code pour que le Storefront sache quelle boutique afficher
    localStorage.setItem('shift_selected_store', JSON.stringify(storeSettings));
    // Force reload du storefront — on pourra améliorer ça plus tard avec un état global
    window.location.reload();
  };

  const handleGoToAuth = () => {
    // Redirige vers l'auth portal en mettant un flag
    localStorage.setItem('shift_go_auth', 'true');
    window.location.reload();
  };

  // Si l'utilisateur vient de HomePage et veut s'auth
  const wantsAuth = localStorage.getItem('shift_go_auth');
  const selectedStore = localStorage.getItem('shift_selected_store');

  const renderView = () => {
    // Utilisateur connecté
    if (user) {
      localStorage.removeItem('shift_go_auth');
      switch (role) {
        case 'merchant':
          return <AdminDashboard onLogout={logout} />;
        case 'client':
        default:
          return <Storefront onLogout={logout} />;
      }
    }

    // Pas connecté mais veut s'authentifier
    if (wantsAuth) {
      return <AuthPortal onBack={() => {
        localStorage.removeItem('shift_go_auth');
        window.location.reload();
      }} />;
    }

    // Page d'accueil par défaut
    return (
      <HomePage
        onEnterStore={handleEnterStore}
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
