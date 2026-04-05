import { create } from 'zustand';
import api from '@/lib/api';
import { Night, CreateNightInput, UpdateNightInput } from '@/types/night';

interface NightsStore {
  nights: Night[];
  currentNight: Night | null;
  loading: boolean;
  fetchNights: () => Promise<void>;
  fetchNight: (id: string) => Promise<void>;
  createNight: (data: CreateNightInput) => Promise<Night>;
  updateNight: (id: string, data: UpdateNightInput) => Promise<Night>;
  deleteNight: (id: string) => Promise<void>;
  clearCurrentNight: () => void;
}

export const useNightsStore = create<NightsStore>((set, get) => ({
  nights: [],
  currentNight: null,
  loading: false,

  fetchNights: async () => {
    set({ loading: true });
    try {
      const { data } = await api.get('/consumer/nights');
      set({ nights: data.data ?? data.nights ?? data });
    } finally {
      set({ loading: false });
    }
  },

  fetchNight: async (id) => {
    set({ loading: true });
    try {
      const { data } = await api.get(`/consumer/nights/${id}`);
      set({ currentNight: data.night ?? data });
    } finally {
      set({ loading: false });
    }
  },

  createNight: async (input) => {
    const { data } = await api.post('/consumer/nights', input);
    const night = data.night ?? data;
    set((state) => ({ nights: [night, ...state.nights] }));
    return night;
  },

  updateNight: async (id, input) => {
    const { data } = await api.put(`/consumer/nights/${id}`, input);
    const night = data.night ?? data;
    set((state) => ({
      nights: state.nights.map((n) => (n.id === id ? night : n)),
      currentNight: state.currentNight?.id === id ? night : state.currentNight,
    }));
    return night;
  },

  deleteNight: async (id) => {
    await api.delete(`/consumer/nights/${id}`);
    set((state) => ({
      nights: state.nights.filter((n) => n.id !== id),
      currentNight: state.currentNight?.id === id ? null : state.currentNight,
    }));
  },

  clearCurrentNight: () => set({ currentNight: null }),
}));
