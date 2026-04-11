import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '@/lib/api';
import { Consumer } from '@/features/auth/types';

interface AuthStore {
  consumer: Consumer | null;
  token: string | null;
  isReady: boolean;
  error: string | null;
  pendingInviteCode: string | null;
  setPendingInviteCode: (code: string | null) => void;
  setAuth: (consumer: Consumer, token: string) => Promise<void>;
  clearAuth: () => Promise<void>;
  hydrate: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  consumer: null,
  token: null,
  isReady: false,
  error: null,
  pendingInviteCode: null,

  setPendingInviteCode: (code) => set({ pendingInviteCode: code }),

  setAuth: async (consumer, token) => {
    await SecureStore.setItemAsync('consumer_token', token);
    set({ consumer, token });
  },

  clearAuth: async () => {
    await SecureStore.deleteItemAsync('consumer_token');
    set({ consumer: null, token: null });
  },

  hydrate: async () => {
    const token = await SecureStore.getItemAsync('consumer_token');
    if (token) {
      try {
        const { data } = await api.get('/consumer/me');
        set({ token, consumer: data.consumer, isReady: true, error: null });
      } catch {
        await SecureStore.deleteItemAsync('consumer_token');
        set({ token: null, consumer: null, isReady: true, error: 'Session expired. Please log in again.' });
      }
    } else {
      set({ isReady: true });
    }
  },

  logout: async () => {
    try {
      await api.post('/consumer/logout');
    } catch {
      // ignore logout API errors
    }
    await get().clearAuth();
  },
}));
