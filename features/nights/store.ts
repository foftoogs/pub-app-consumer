import { create } from 'zustand';
import api from '@/lib/api';
import { useAuthStore } from '@/features/auth/store';
import { Consumer } from '@/features/auth/types';
import { Night, NightMember, NightInvite, Itinerary, CreateNightInput, UpdateNightInput, AddItineraryInput } from '@/features/nights/types';

interface NightsStore {
  nights: Night[];
  currentNight: Night | null;
  loading: boolean;
  error: string | null;
  fetchNights: () => Promise<void>;
  fetchNight: (id: string) => Promise<void>;
  createNight: (data: CreateNightInput) => Promise<Night>;
  updateNight: (id: string, data: UpdateNightInput) => Promise<Night>;
  deleteNight: (id: string) => Promise<void>;
  clearCurrentNight: () => void;
  addMemberByIdentifier: (nightId: string, identifier: string) => Promise<{ member?: NightMember; invited?: boolean; message?: string }>;
  addMemberById: (nightId: string, consumerId: string) => Promise<NightMember>;
  searchConsumers: (query: string) => Promise<Consumer[]>;
  fetchPreviousMembers: (query?: string, nightId?: string) => Promise<Consumer[]>;
  updateMemberRsvp: (memberId: string, rsvpStatus: NightMember['rsvp_status']) => Promise<NightMember>;
  removeMember: (memberId: string) => Promise<void>;
  addItineraryItem: (nightId: string, input: AddItineraryInput) => Promise<Itinerary>;
  reorderItinerary: (nightId: string, itemIds: string[]) => Promise<void>;
  removeItineraryItem: (nightId: string, itemId: string) => Promise<void>;
  generateInvite: (nightId: string) => Promise<NightInvite>;
  acceptInvite: (code: string) => Promise<string>;
  fetchInviteDetails: (code: string) => Promise<{ invite: NightInvite; night: Night }>;
  respondToNight: (nightId: string, rsvpStatus: 'going' | 'maybe' | 'declined') => Promise<void>;
}

export const useNightsStore = create<NightsStore>((set, get) => ({
  nights: [],
  currentNight: null,
  loading: false,
  error: null,

  fetchNights: async () => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get('/consumer/nights');
      set({ nights: data.data ?? data.nights ?? data });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load nights' });
    } finally {
      set({ loading: false });
    }
  },

  fetchNight: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.get(`/consumer/nights/${id}`);
      set({ currentNight: data.night ?? data });
    } catch (err: any) {
      set({ error: err.response?.data?.message ?? 'Failed to load night' });
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

  addMemberByIdentifier: async (nightId, identifier) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/members`, {
      identifier,
    });

    if (data.invited) {
      return { invited: true, message: data.message };
    }

    const member = data.member ?? data;
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          members: [...state.currentNight.members, member],
          members_count: state.currentNight.members_count + 1,
        },
      };
    });
    return { member };
  },

  addMemberById: async (nightId, consumerId) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/members`, {
      consumer_id: consumerId,
    });
    const member = data.member ?? data;
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          members: [...state.currentNight.members, member],
          members_count: state.currentNight.members_count + 1,
        },
      };
    });
    return member;
  },

  searchConsumers: async (query) => {
    const { data } = await api.get('/consumer/search', { params: { q: query } });
    return data.consumers ?? [];
  },

  fetchPreviousMembers: async (query, nightId) => {
    const params: Record<string, string> = {};
    if (query) params.q = query;
    if (nightId) params.night_id = nightId;
    const { data } = await api.get('/consumer/previous-members', { params });
    return data.consumers ?? [];
  },

  updateMemberRsvp: async (memberId, rsvpStatus) => {
    const { data } = await api.put(`/consumer/members/${memberId}`, {
      rsvp_status: rsvpStatus,
    });
    const updated = data.member ?? data;
    set((state) => {
      if (!state.currentNight) return state;
      return {
        currentNight: {
          ...state.currentNight,
          members: state.currentNight.members.map((m) =>
            m.id === memberId ? updated : m
          ),
        },
      };
    });
    return updated;
  },

  removeMember: async (memberId) => {
    await api.delete(`/consumer/members/${memberId}`);
    set((state) => {
      if (!state.currentNight) return state;
      return {
        currentNight: {
          ...state.currentNight,
          members: state.currentNight.members.filter((m) => m.id !== memberId),
          members_count: state.currentNight.members_count - 1,
        },
      };
    });
  },

  addItineraryItem: async (nightId, input) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/itinerary`, input);
    const item = data.itinerary ?? data;
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          itinerary: [...state.currentNight.itinerary, item],
          itinerary_count: state.currentNight.itinerary_count + 1,
        },
      };
    });
    return item;
  },

  reorderItinerary: async (nightId, itemIds) => {
    const { data } = await api.put(`/consumer/nights/${nightId}/itinerary`, { items: itemIds });
    const items = data.itinerary ?? data;
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          itinerary: items,
        },
      };
    });
  },

  removeItineraryItem: async (nightId, itemId) => {
    await api.delete(`/consumer/nights/${nightId}/itinerary/${itemId}`);
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          itinerary: state.currentNight.itinerary.filter((i) => i.id !== itemId),
          itinerary_count: state.currentNight.itinerary_count - 1,
        },
      };
    });
  },

  generateInvite: async (nightId) => {
    const { data } = await api.post(`/consumer/nights/${nightId}/invites`);
    const invite = data.invite ?? data;
    set((state) => {
      if (!state.currentNight || state.currentNight.id !== nightId) return state;
      return {
        currentNight: {
          ...state.currentNight,
          invites: [invite, ...state.currentNight.invites],
        },
      };
    });
    return invite;
  },

  acceptInvite: async (code) => {
    const { data } = await api.post(`/consumer/invites/${code}/accept`);
    return data.night_id;
  },

  fetchInviteDetails: async (code) => {
    const { data } = await api.get(`/consumer/invites/${code}`);
    return { invite: data.invite, night: data.night };
  },

  respondToNight: async (nightId, rsvpStatus) => {
    await api.post(`/consumer/nights/${nightId}/respond`, { rsvp_status: rsvpStatus });
    const currentUserId = useAuthStore.getState().consumer?.id;
    const updateMembers = (members: NightMember[]) =>
      members.map((m) =>
        m.consumer.id === currentUserId ? { ...m, rsvp_status: rsvpStatus } : m
      );
    set((state) => ({
      nights: state.nights.map((n) =>
        n.id === nightId ? { ...n, current_user_rsvp: rsvpStatus, members: updateMembers(n.members) } : n
      ),
      currentNight: state.currentNight?.id === nightId
        ? { ...state.currentNight, current_user_rsvp: rsvpStatus, members: updateMembers(state.currentNight.members) }
        : state.currentNight,
    }));
  },
}));
