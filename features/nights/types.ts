import { Consumer } from '@/features/auth/types';

export interface NightMember {
  id: string;
  consumer: Consumer;
  role: 'organiser' | 'member';
  rsvp_status: 'pending' | 'going' | 'maybe' | 'declined';
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
  invite_code: string;
  invited_by: Consumer;
  accepted_by: Consumer | null;
  status: 'pending' | 'used' | 'expired';
  accepted_at: string | null;
  expires_at: string | null;
  created_at: string;
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
  current_user_rsvp: NightMember['rsvp_status'] | null;
  members: NightMember[];
  itinerary: Itinerary[];
  invites: NightInvite[];
  created_at: string;
  updated_at: string;
}

export interface KittyContribution {
  id: string;
  consumer: Consumer;
  amount: string;
  status: 'pending' | 'confirmed' | 'failed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface Kitty {
  id: string;
  night_id: string;
  total_balance: string;
  currency: string;
  status: 'open' | 'closed';
  contributions: KittyContribution[];
  created_at: string;
  updated_at: string;
}

export interface SpendLimit {
  id: string;
  max_amount: string;
  current_spend: string;
  alert_threshold: string | null;
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
