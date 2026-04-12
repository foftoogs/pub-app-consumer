import { create } from 'zustand';
import api from '@/lib/api';
import { Venue, VenueAvailability } from '@/features/nights/types';

export interface VenueFilters {
  search?: string;
  type?: string;
  vibe?: string;
  price_tier?: string;
  suburb?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  sort?: 'name' | 'price' | 'distance';
}

interface VenuesStore {
  venues: Venue[];
  currentVenue: Venue | null;
  availability: VenueAvailability[];
  filters: VenueFilters;
  loading: boolean;
  error: string | null;
  fetchVenues: (filters?: VenueFilters) => Promise<void>;
  fetchVenue: (id: string) => Promise<void>;
  fetchAvailability: (venueId: string, date?: string) => Promise<void>;
  setFilters: (filters: VenueFilters) => void;
  clearFilters: () => void;
}

export const useVenuesStore = create<VenuesStore>((set, get) => ({
  venues: [],
  currentVenue: null,
  availability: [],
  filters: {},
  loading: false,
  error: null,

  fetchVenues: async (filters) => {
    set({ loading: true, error: null });
    try {
      const activeFilters = filters ?? get().filters;
      const params: Record<string, string> = {};
      if (activeFilters.search) params.search = activeFilters.search;
      if (activeFilters.type) params.type = activeFilters.type;
      if (activeFilters.vibe) params.vibe = activeFilters.vibe;
      if (activeFilters.price_tier) params.price_tier = activeFilters.price_tier;
      if (activeFilters.suburb) params.suburb = activeFilters.suburb;
      if (activeFilters.lat != null) params.lat = String(activeFilters.lat);
      if (activeFilters.lng != null) params.lng = String(activeFilters.lng);
      if (activeFilters.radius != null) params.radius = String(activeFilters.radius);
      if (activeFilters.sort) params.sort = activeFilters.sort;

      const { data } = await api.get('/consumer/venues', { params });
      set({ venues: data.data ?? data.venues ?? data });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load venues' });
    } finally {
      set({ loading: false });
    }
  },

  fetchVenue: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/consumer/venues/${id}`);
      set({ currentVenue: data.data ?? data });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load venue' });
    } finally {
      set({ loading: false });
    }
  },

  fetchAvailability: async (venueId, date) => {
    try {
      const params: Record<string, string> = {};
      if (date) params.date = date;
      const { data } = await api.get(`/consumer/venues/${venueId}/availability`, { params });
      set({ availability: data.data ?? data });
    } catch {
      set({ availability: [] });
    }
  },

  setFilters: (filters) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },
}));
