// Mirrors the Supabase database schema defined in the project plan.
// Extend these as tables are created in Supabase.

export interface Shop {
  id: string;
  name: string;
  slug: string;
  description: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  postcode: string;
  latitude: number;
  longitude: number;
  phone: string | null;
  website: string | null;
  email: string | null;
  founded_year: number | null;
  opening_hours: Record<string, unknown>;
  price_range: 1 | 2 | 3 | 4;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Profile {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  total_points: number;
  total_visits: number;
  unique_shops_visited: number;
  expo_push_token: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface CheckIn {
  id: string;
  user_id: string;
  shop_id: string;
  checked_in_at: string;
  latitude: number;
  longitude: number;
  photo_url: string | null;
  notes: string | null;
  points_earned: number;
}

export interface Badge {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string;
  category: string;
  criteria_type: string;
  criteria_value: number;
  criteria_shops: string[] | null;
  is_active: boolean;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  invite_code: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}
