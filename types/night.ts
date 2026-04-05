import { Consumer } from './consumer';

export interface NightMember {
  id: string;
  consumer: Consumer;
  role: 'organiser' | 'member';
  rsvp_status: 'going' | 'maybe' | 'declined';
  created_at: string;
  updated_at: string;
}

export interface Itinerary {
  id: string;
  venue_id: string;
  venue_name: string;
  venue_suburb: string;
  position: number;
  arrival_time: string | null;
  departure_time: string | null;
  created_at: string;
  updated_at: string;
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
