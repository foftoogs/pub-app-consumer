import { create } from 'zustand';
import api from '@/lib/api';
import { Kitty, KittyContribution, SpendLimit } from '@/features/nights/types';

interface KittyStore {
  kitty: Kitty | null;
  spendLimit: SpendLimit | null;
  loading: boolean;
  error: string | null;
  fetchKitty: (nightId: string) => Promise<void>;
  createKitty: (nightId: string) => Promise<Kitty>;
  closeKitty: (nightId: string) => Promise<void>;
  contribute: (nightId: string, amount: number) => Promise<{ clientSecret: string; contribution: KittyContribution }>;
  fetchSpendLimit: (nightId: string) => Promise<void>;
  updateSpendLimit: (nightId: string, maxAmount: number, alertThreshold?: number | null) => Promise<SpendLimit>;
  clearKitty: () => void;
}

export const useKittyStore = create<KittyStore>((set) => ({
  kitty: null,
  spendLimit: null,
  loading: false,
  error: null,

  fetchKitty: async (nightId) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/consumer/nights/${nightId}/kitty`);
      set({ kitty: data });
    } catch (err: any) {
      if (err.response?.status === 404) {
        set({ kitty: null });
      } else {
        set({ error: err.response?.data?.message ?? 'Failed to load kitty' });
      }
    } finally {
      set({ loading: false });
    }
  },

  createKitty: async (nightId) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/kitty`);
    set({ kitty: { ...data, contributions: [] } });
    return data;
  },

  closeKitty: async (nightId) => {
    const { data } = await api.delete(`/consumer/nights/${nightId}/kitty`);
    set({ kitty: data });
  },

  contribute: async (nightId, amount) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/kitty/contribute`, { amount });
    const contribution = data.contribution;
    set((state) => {
      if (!state.kitty) return state;
      return {
        kitty: {
          ...state.kitty,
          contributions: [contribution, ...state.kitty.contributions],
        },
      };
    });
    return { clientSecret: data.client_secret, contribution };
  },

  fetchSpendLimit: async (nightId) => {
    try {
      const { data } = await api.get(`/consumer/nights/${nightId}/spend-limit`);
      set({ spendLimit: data });
    } catch (err: any) {
      if (err.response?.status === 404) {
        set({ spendLimit: null });
      }
    }
  },

  updateSpendLimit: async (nightId, maxAmount, alertThreshold) => {
    const { data } = await api.put(`/consumer/nights/${nightId}/spend-limit`, {
      max_amount: maxAmount,
      alert_threshold: alertThreshold ?? null,
    });
    set({ spendLimit: data });
    return data;
  },

  clearKitty: () => set({ kitty: null, spendLimit: null, error: null }),
}));
