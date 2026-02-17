
export enum Category {
  SHELTER = 'Shelter',
  SLEEP = 'Sleep',
  CLOTHING = 'Clothing',
  COOKING = 'Cooking',
  ELECTRONICS = 'Electronics',
  HYGIENE = 'Hygiene',
  FOOD = 'Food',
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
  notes?: string;
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
