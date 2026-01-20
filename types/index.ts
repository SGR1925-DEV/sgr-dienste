export interface Match {
  id: number;
  opponent: string;
  date: string;
  time: string;
  location: string;
  team?: string | null; // 1. Mannschaft, 2. Mannschaft, 3. Mannschaft
}

export interface Slot {
  id: number;
  match_id: number;
  category: string;
  time: string;
  user_name: string | null;
  user_contact: string | null;
  cancellation_requested: boolean;
}

export interface ServiceType {
  id: number;
  name: string;
  default_count: number;
}

export interface ServiceTypeMember {
  id: number;
  service_type_id: number;
  name: string;
  order?: number | null;
}