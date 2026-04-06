import { create } from 'zustand';
import api from '@/lib/api';
import { Night, NightMember, NightInvite, Venue, Itinerary, CreateNightInput, UpdateNightInput, AddItineraryInput } from '@/types/night';

interface NightsStore {
  nights: Night[];
  currentNight: Night | null;
  loading: boolean;
  venues: Venue[];
  venuesLoading: boolean;
  fetchNights: () => Promise<void>;
  fetchNight: (id: string) => Promise<void>;
  createNight: (data: CreateNightInput) => Promise<Night>;
  updateNight: (id: string, data: UpdateNightInput) => Promise<Night>;
  deleteNight: (id: string) => Promise<void>;
  clearCurrentNight: () => void;
  addMember: (nightId: string, consumerId: string) => Promise<NightMember>;
  updateMemberRsvp: (memberId: string, rsvpStatus: NightMember['rsvp_status']) => Promise<NightMember>;
  removeMember: (memberId: string) => Promise<void>;
  fetchVenues: (search?: string) => Promise<void>;
  addItineraryItem: (nightId: string, input: AddItineraryInput) => Promise<Itinerary>;
  reorderItinerary: (nightId: string, itemIds: string[]) => Promise<void>;
  removeItineraryItem: (nightId: string, itemId: string) => Promise<void>;
  generateInvite: (nightId: string) => Promise<NightInvite>;
  acceptInvite: (code: string) => Promise<string>;
}

export const useNightsStore = create<NightsStore>((set, get) => ({
  nights: [],
  currentNight: null,
  loading: false,
  venues: [],
  venuesLoading: false,

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

  addMember: async (nightId, consumerId) => {
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

  fetchVenues: async (search) => {
    set({ venuesLoading: true });
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      const { data } = await api.get('/consumer/venues', { params });
      set({ venues: data.data ?? data.venues ?? data });
    } finally {
      set({ venuesLoading: false });
    }
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
}));
