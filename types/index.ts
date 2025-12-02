export interface Match {
  id: number;
  opponent: string;
  date: string;
  time: string;
}

export interface Slot {
  id: number;
  match_id: number;
  category: string;
  time: string;
  user_name: string | null;
}
