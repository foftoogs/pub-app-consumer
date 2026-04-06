import { Consumer } from './consumer';

export interface NightMember {
  id: string;
  consumer: Consumer;
  role: 'organiser' | 'member';
  rsvp_status: 'going' | 'maybe' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string | null;
  suburb: string | null;
  state: string | null;
  postcode: string | null;
  latitude: number | null;
  longitude: number | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  is_active: boolean;
}

export interface Itinerary {
  id: string;
  venue: Venue;
  order: number;
  estimated_arrival: string | null;
  estimated_departure: string | null;
  created_at: string;
  updated_at: string;
}

export interface AddItineraryInput {
  venue_id: string;
  estimated_arrival?: string;
  estimated_departure?: string;
}

export interface NightInvite {
  id: string;
  code: string;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Night {
  id: string;
  name: string;
  date: string;
  theme: string | null;
  budget: number | null;
  status: 'planning' | 'active' | 'closed' | 'cancelled';
  organiser: Consumer;
  members_count: number;
  itinerary_count: number;
  members: NightMember[];
  itinerary: Itinerary[];
  invites: NightInvite[];
  created_at: string;
  updated_at: string;
}

export interface CreateNightInput {
  name: string;
  date: string;
  theme?: string;
  budget?: number;
}

export interface UpdateNightInput {
  name?: string;
  date?: string;
  theme?: string;
  budget?: number;
}
