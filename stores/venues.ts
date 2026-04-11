import { create } from 'zustand';
import api from '@/lib/api';
import { Venue } from '@/types/night';

interface VenuesStore {
  venues: Venue[];
  loading: boolean;
  error: string | null;
  fetchVenues: (search?: string) => Promise<void>;
}

export const useVenuesStore = create<VenuesStore>((set) => ({
  venues: [],
  loading: false,
  error: null,

  fetchVenues: async (search) => {
    set({ loading: true, error: null });
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get('/consumer/venues', { params });
      set({ venues: data.data ?? data.venues ?? data });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load venues' });
    } finally {
      set({ loading: false });
    }
  },
}));
