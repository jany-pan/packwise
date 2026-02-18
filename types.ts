
export enum Category {
  PACKING = 'Packing', 
  SHELTER = 'Shelter',
  SLEEP = 'Sleep',
  CLOTHING = 'Clothing',
  KITCHEN = 'Kitchen', 
  ELECTRONICS = 'Electronics',
  HYGIENE = 'Hygiene',
  MISC = 'Misc'
}

export type Language = 'en' | 'sk';

export interface GearItem {
  id: string;
  name: string;
  category: Category;
  weight: number; // in grams (per unit)
  price: number;
  quantity: number;
  isWorn: boolean;
  isConsumable: boolean;
  isChecked?: boolean;
  notes?: string;
  link?: string;
}

export interface ParticipantPack {
  id: string;
  ownerName: string;
  items: GearItem[];
}

export interface Trip {
  id: string;
  name: string;
  leaderName: string;
  leaderId: string;
  routeUrl?: string;
  participants: ParticipantPack[];
}

export interface PackStats {
  totalWeight: number;
  baseWeight: number; 
  wornWeight: number;
  consumableWeight: number;
  totalPrice: number;
}

export interface RecentTrip {
  id: string; // The Supabase ID
  name: string;
  lastVisited: number;
}