
export enum DriverLevel {
  BRONZE = 'Bronze',
  OURO = 'Ouro',
  DIAMANTE = 'Diamante'
}

export type UserType = 'driver' | 'store' | 'admin' | null;

export interface ChatMessage {
  id: string;
  sender: 'me' | 'other';
  text: string;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  restaurant: string;
  amount: number;
  date: string; // ISO string
  type: 'delivery' | 'tip' | 'bonus' | 'withdrawal';
  status: 'completed' | 'pending' | 'processing';
  distance?: string;
  isAppPayment?: boolean;
}

export interface DriverStats {
  score: number; // 0-100
  acceptanceRate: number; // percentage
  cancellationRate: number; // percentage
  onTimeRate: number; // percentage
  customerRating: number; // 0-5
  totalDeliveries: number;
  level: DriverLevel;
}

export interface Store {
  id: string;
  name: string;
  category: string;
  rating: number;
  distance: string;
  status: 'open' | 'closed' | 'busy';
  imageUrl: string;
  address: string;
  lat?: number; // Latitude geográfica
  lng?: number; // Longitude geográfica
}

export interface PendingDriver {
  id: string;
  name: string;
  cpf: string;
  vehicle: string;
  plate: string;
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  documents: {
    cnh: string; // URL da imagem
    crlv: string; // URL da imagem
  };
}

export enum View {
  HOME = 'home',
  STORES = 'stores',
  WALLET = 'wallet',
  PERFORMANCE = 'performance',
  PROFILE = 'profile'
}
