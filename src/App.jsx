import React, { useEffect, useState, Suspense } from 'react';
import AdminDashboard from './pages/admin/AdminDashboard';
import AuthPortal from './pages/AuthPortal';
import HomePage from './pages/HomePage';
import ClientHome from './pages/ClientHome';
import ClientAccount from './pages/ClientAccount';
import PublicAgencyPage from './pages/PublicAgencyPage';
import { useTheme } from './hooks/useTheme';
import { useAuthStore } from './store/useAuthStore';
import { supabase } from './lib/supabase';

const LoadingFallback = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#D4AF37]">Initialisation Shift</p>
    </div>
  </div>
);

const getAgencyCodeFromURL = () => {
  const path = window.location.pathname;
  const match = path.match(/^\/agence\/([A-Z0-9_-]+)$/i);
  return match ? match[1].toUpperCase() : null;
};

const DepositSuccessPage = ({ bookingId, onContinue }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
    <div className="text-center max-w-md">
      <div className="w-24 h-24 bg-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(212,175,55,0.4)]">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      </div>
      <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">
        Caution <span style={{ color: '#D4AF37' }}>Payée !</span>
      </h1>
      <p className="text-zinc-400 text-sm mb-4">
        Votre caution a été enregistrée avec succès. L'agence va confirmer votre réservation.
      </p>
      {bookingId && (
        <p className="text-zinc-600 text-[10px] font-bold uppercase mb-8">
          Référence : {bookingId.slice(0, 8).toUpperCase()}
        </p>
      )}
      <button onClick={onContinue}
        className="px-10 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
        Retour à l'accueil
      </button>
    </div>
  </div>
);

export default function App() {
  const { theme } = useTheme();
  const { user, role, isLoading, initSession, logout } = useAuthStore();

  const [clientView, setClientView] = useState('home');
  const [selectedStore, setSelectedStore] = useState(() => {
    const saved = localStorage.getItem('shift_selected_store');
    return saved ? JSON.parse(saved) : null;
  });
  const [publicAgencyCode, setPublicAgencyCode] = useState(() => getAgencyCodeFromURL());

  const urlParams = new URLSearchParams(window.location.search);
  const depositSuccess = urlParams.get('deposit_success');
  const depositCancelled = urlParams.get('deposit_cancelled');
  const depositBookingId = urlParams.get('booking_id');

  const wantsAuth = localStorage.getItem('shift_go_auth');

  useEffect(() => { initSession(); }, []);

  useEffect(() => {
    const code = getAgencyCodeFromURL();
    if (code) {
      setPublicAgencyCode(code);
      setClientView('public_agency');
    }
  }, []);

  // Nettoyage — on ne redirige plus automatiquement vers le store à la connexion
  useEffect(() => {
    if (user && role !== 'merchant') {
      localStorage.removeItem('shift_viewing_store');
      localStorage.removeItem('shift_selected_store');
    }
  }, [user]);

  // ── Marquer la caution comme payée après retour Stripe ─────────────────
  useEffect(() => {
    if (depositSuccess && depositBookingId) {
      supabase.from('bookings').update({
        deposit_status: 'paid',
        updated_at: new Date(),
      }).eq('id', depositBookingId).then(({ error }) => {
        if (error) console.error('Erreur mise à jour caution:', error);
        else console.log('Caution marquée comme payée ✅');
      });
    }
  }, [depositSuccess, depositBookingId]);

  if (isLoading) return <LoadingFallback />;

  // ── Page succès caution ──
  if (depositSuccess) {
    return (
      <DepositSuccessPage
        bookingId={depositBookingId}
        onContinue={() => {
          window.history.pushState({}, '', '/');
          window.location.reload();
        }}
      />
    );
  }

  // ── Page annulation caution ──
  if (depositCancelled) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-zinc-900 border border-zinc-700 rounded-full flex items-center justify-center mx-auto mb-8">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <h1 className="text-3xl font-black uppercase tracking-tighter mb-4">Paiement annulé</h1>
          <p className="text-zinc-400 text-sm mb-8">Votre réservation a été créée mais la caution n'a pas été payée.</p>
          <button onClick={() => { window.history.pushState({}, '', '/'); window.location.reload(); }}
            className="px-10 py-4 bg-[#D4AF37] text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all">
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  const handleEnterStore = (storeSettings) => {
    localStorage.setItem('shift_selected_store', JSON.stringify(storeSettings));
    localStorage.setItem('shift_viewing_store', 'true');
    setSelectedStore(storeSettings);
    if (window.location.pathname.startsWith('/agence/')) {
      window.history.pushState({}, '', '/');
    }
    setPublicAgencyCode(null);
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

  const handleGoToPublicAgency = (code) => {
    setPublicAgencyCode(code);
    window.history.pushState({}, '', `/agence/${code}`);
    setClientView('public_agency');
  };

  const handleLeavePublicAgency = () => {
    window.history.pushState({}, '', '/');
    setPublicAgencyCode(null);
    setClientView('home');
  };

  const renderView = () => {
    if (clientView === 'public_agency' && publicAgencyCode) {
      return (
        <PublicAgencyPage
          storeCode={publicAgencyCode}
          onEnterStore={(store) => {
            if (!user) {
              localStorage.setItem('shift_selected_store', JSON.stringify(store));
              localStorage.setItem('shift_viewing_store', 'true');
              localStorage.setItem('shift_go_auth', 'true');
              window.history.pushState({}, '', '/');
              window.location.reload();
            } else {
              handleEnterStore(store);
            }
          }}
          onBack={handleLeavePublicAgency}
        />
      );
    }

    if (user) {
      localStorage.removeItem('shift_go_auth');
      if (role === 'merchant') return <AdminDashboard onLogout={logout} />;
      if (clientView === 'account') return <ClientAccount onBack={() => setClientView('home')} />;
      if (clientView === 'store' && selectedStore) {
        const StorefrontClient = React.lazy(() => import('./pages/client/Storefront'));
        return (
          <Suspense fallback={<LoadingFallback />}>
            <StorefrontClient onLogout={logout} onLeave={handleLeaveStore} />
          </Suspense>
        );
      }
      return (
        <ClientHome
          onEnterStore={handleEnterStore}
          onGoToAccount={() => setClientView('account')}
          onGoToPublicAgency={handleGoToPublicAgency}
        />
      );
    }

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

