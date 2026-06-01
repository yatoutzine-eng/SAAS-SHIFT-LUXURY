import { create } from 'zustand';
import { supabase } from '../lib/supabase';

export const useAuthStore = create((set) => ({
  user: null,
  role: null, // 'client' | 'merchant'
  isLoading: true,

  // Initialise la session au démarrage (appelé dans App.jsx)
  initSession: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const role = session.user.user_metadata?.role || 'client';
      set({ user: session.user, role, isLoading: false });
    } else {
      set({ user: null, role: null, isLoading: false });
    }

    // Écoute les changements de session (login / logout / refresh token)
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const role = session.user.user_metadata?.role || 'client';
        set({ user: session.user, role, isLoading: false });
      } else {
        set({ user: null, role: null, isLoading: false });
      }
    });
  },

  // Connexion
  login: async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const role = data.user?.user_metadata?.role || 'client';
    set({ user: data.user, role });
    return role;
  },

  // Inscription — le rôle est sauvegardé dans user_metadata
  signup: async (email, password, name, role) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, role }
      }
    });
    if (error) throw error;
    return data;
  },

  // Déconnexion
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null });
  },
}));
