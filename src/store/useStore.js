import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useStore = create(
  persist(
    (set) => ({
      // Agences Partenaires
      agencies: [
        { 
          id: 'PAR-001', 
          name: "Shift Luxury Paris", 
          city: "Paris", 
          code: "75008", 
          image: "https://images.pexels.com/photos/3802510/pexels-photo-3802510.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
          vehicleCount: 12,
          coords: [48.8566, 2.3522]
        },
        { 
          id: 'MON-002', 
          name: "Shift Luxury Monaco", 
          city: "Monte-Carlo", 
          code: "98000", 
          image: "https://images.pexels.com/photos/3593922/pexels-photo-3593922.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
          vehicleCount: 8,
          coords: [43.7384, 7.4246]
        },
        { 
          id: 'COU-003', 
          name: "Shift Luxury Courchevel", 
          city: "Courchevel 1850", 
          code: "73120", 
          image: "https://images.pexels.com/photos/943907/pexels-photo-943907.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
          vehicleCount: 5,
          coords: [45.4147, 6.6341]
        }
      ],
      vehicles: [
        { id: 1, agencyId: 'PAR-001', model: "Ferrari F8 Tributo", price: 1200, fuel: "Essence", seats: 2, image: "https://images.pexels.com/photos/337909/pexels-photo-337909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", hp: 720, speed: 340 },
        { id: 2, agencyId: 'MON-002', model: "Lamborghini Huracán", price: 1500, fuel: "Essence", seats: 2, image: "https://images.pexels.com/photos/3972755/pexels-photo-3972755.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", hp: 640, speed: 325 },
        { id: 3, agencyId: 'PAR-001', model: "Porsche 911 GT3", price: 950, fuel: "Essence", seats: 2, image: "https://images.pexels.com/photos/3849554/pexels-photo-3849554.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", hp: 510, speed: 318 },
        { id: 4, agencyId: 'COU-003', model: "Range Rover Autobiography", price: 600, fuel: "Hybride", seats: 5, image: "https://images.pexels.com/photos/116675/pexels-photo-116675.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", hp: 530, speed: 250 },
        { id: 5, agencyId: 'MON-002', model: "Bentley Continental GT", price: 1100, fuel: "Essence", seats: 4, image: "https://images.pexels.com/photos/1754686/pexels-photo-1754686.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", hp: 635, speed: 333 },
      ],
      reservations: [],
      profile: {
        firstName: "Jean",
        lastName: "Dupont",
        email: "jean@shift.fr",
        phone: "06 12 34 56 78",
        address: "12 Avenue Montaigne, Paris"
      },
      addReservation: (res) => set((state) => ({ 
        reservations: [res, ...state.reservations] 
      })),
      updateProfile: (newProfile) => set({ profile: newProfile }),
    }),
    {
      name: 'shift-luxury-marketplace-v1',
    }
  )
);
