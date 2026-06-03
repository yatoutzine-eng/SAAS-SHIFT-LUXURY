import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Car, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const GOLD = "#D4AF37";

const NOTIF_ICONS = {
  'new_booking':  { icon: Car,          color: GOLD,       bg: 'bg-[#D4AF37]/10' },
  'booking_paid': { icon: CheckCircle,  color: '#34d399',  bg: 'bg-emerald-500/10' },
  'return_today': { icon: Clock,        color: '#60a5fa',  bg: 'bg-blue-500/10' },
  'pending':      { icon: AlertCircle,  color: '#f87171',  bg: 'bg-red-500/10' },
  'default':      { icon: Bell,         color: GOLD,       bg: 'bg-[#D4AF37]/10' },
};

export default function NotificationsPanel({ onNavigate }) {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const panelRef = useRef(null);

  useEffect(() => {
    loadNotifications();
    setupRealtime();

    const handleClick = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const loadNotifications = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      setNotifications(data || []);
      setUnreadCount((data || []).filter(n => !n.read).length);
    } catch (err) {
      // Table pas encore créée — on génère des notifs depuis les bookings
      await loadNotificationsFromBookings();
    }
  };

  const loadNotificationsFromBookings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: bookings } = await supabase
        .from('bookings')
        .select('*, fleet(model)')
        .eq('merchant_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!bookings) return;

      const today = new Date().toISOString().split('T')[0];
      const notifs = bookings.map(b => ({
        id: b.id,
        type: b.status === 'pending' ? 'pending' : b.end_date === today ? 'return_today' : 'new_booking',
        title: b.status === 'pending' ? 'Nouvelle réservation' : b.end_date === today ? 'Retour prévu aujourd\'hui' : 'Réservation confirmée',
        message: `${b.client_name || 'Client'} — ${b.fleet?.model || 'Véhicule'}`,
        created_at: b.created_at,
        read: !['pending'].includes(b.status),
        booking_id: b.id,
        view: b.status === 'pending' ? 'bookings' : 'planning',
      }));

      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) { console.error(err); }
  };

  const setupRealtime = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Écoute les nouvelles réservations en temps réel
      supabase
        .channel('new_bookings')
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'bookings',
          filter: `merchant_id=eq.${user.id}`
        }, (payload) => {
          const newNotif = {
            id: payload.new.id,
            type: 'new_booking',
            title: '🔔 Nouvelle réservation !',
            message: `${payload.new.client_name || 'Client'} vient de réserver`,
            created_at: new Date().toISOString(),
            read: false,
            view: 'bookings',
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        })
        .subscribe();
    } catch (err) { console.error(err); }
  };

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const handleNotifClick = (notif) => {
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - (notif.read ? 0 : 1)));
    if (notif.view && onNavigate) onNavigate(notif.view);
    setIsOpen(false);
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60);
    if (diff < 1) return 'À l\'instant';
    if (diff < 60) return `Il y a ${diff}min`;
    if (diff < 1440) return `Il y a ${Math.floor(diff / 60)}h`;
    return date.toLocaleDateString('fr-FR');
  };

  return (
    <div className="relative" ref={panelRef}>
      {/* Bouton cloche */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 hover:border-[#D4AF37]/30 transition-all"
      >
        <Bell size={18} className={unreadCount > 0 ? 'text-[#D4AF37]' : 'text-zinc-500'} />
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }} animate={{ scale: 1 }}
            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.span>
        )}
      </button>

      {/* Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 top-14 w-96 bg-zinc-900 border border-white/10 rounded-[2rem] shadow-2xl overflow-hidden z-50"
          >
            {/* Header panel */}
            <div className="flex items-center justify-between p-5 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Bell size={16} style={{ color: GOLD }} />
                <span className="text-sm font-black uppercase tracking-widest">Notifications</span>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button onClick={markAllRead} className="text-[9px] font-black uppercase text-zinc-500 hover:text-[#D4AF37] transition-colors">
                    Tout lire
                  </button>
                )}
                <button onClick={() => setIsOpen(false)} className="p-1 hover:text-[#D4AF37] transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Liste notifs */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <Bell size={24} className="text-zinc-700 mx-auto mb-3" />
                  <p className="text-zinc-500 text-xs font-bold uppercase">Aucune notification</p>
                </div>
              ) : (
                notifications.map(notif => {
                  const { icon: Icon, color, bg } = NOTIF_ICONS[notif.type] || NOTIF_ICONS.default;
                  return (
                    <button key={notif.id} onClick={() => handleNotifClick(notif)}
                      className={`w-full flex items-start gap-4 p-5 border-b border-white/5 hover:bg-white/5 transition-all text-left ${!notif.read ? 'bg-[#D4AF37]/3' : ''}`}>
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bg}`}>
                        <Icon size={16} style={{ color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-xs font-black uppercase leading-tight ${!notif.read ? 'text-white' : 'text-zinc-400'}`}>
                          {notif.title}
                        </p>
                        <p className="text-[10px] text-zinc-500 font-bold mt-1 truncate">{notif.message}</p>
                        <p className="text-[9px] text-zinc-600 font-bold uppercase mt-1">{formatTime(notif.created_at)}</p>
                      </div>
                      {!notif.read && <div className="w-2 h-2 rounded-full bg-[#D4AF37] flex-shrink-0 mt-2" />}
                    </button>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
