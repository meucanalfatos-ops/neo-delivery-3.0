
import { DriverLevel, DriverStats, Transaction, Store, PendingDriver } from './types';

export const MOCK_STATS: DriverStats = {
  score: 850,
  acceptanceRate: 92,
  cancellationRate: 1.5,
  onTimeRate: 98,
  customerRating: 4.92,
  totalDeliveries: 1243,
  level: DriverLevel.OURO
};

// Lógica: Max(6.70, km * 1.30)
export const MOCK_TRANSACTIONS: Transaction[] = [
  { id: 't1', restaurant: 'Burger King', amount: 6.90, date: '2023-10-26T14:30:00', type: 'delivery', status: 'completed', distance: '3.2km' }, 
  { id: 't2', restaurant: 'Sushi House', amount: 10.40, date: '2023-10-26T13:15:00', type: 'delivery', status: 'completed', distance: '8.0km' }, 
  { id: 't3', restaurant: 'Gorjeta - Sushi House', amount: 5.00, date: '2023-10-26T13:15:00', type: 'tip', status: 'completed' },
  { id: 't4', restaurant: 'McDonalds', amount: 6.90, date: '2023-10-26T12:00:00', type: 'delivery', status: 'completed', distance: '1.8km' }, 
  { id: 't5', restaurant: 'Saque Instantâneo', amount: -150.00, date: '2023-10-25T20:00:00', type: 'withdrawal', status: 'completed' },
  { id: 't6', restaurant: 'Rota Longa Extra', amount: 15.60, date: '2023-10-25T19:00:00', type: 'delivery', status: 'completed', distance: '12.0km' }, 
];

export const WEEKLY_DATA = [
  { name: 'Seg', value: 120 },
  { name: 'Ter', value: 80 },
  { name: 'Qua', value: 150 },
  { name: 'Qui', value: 190 },
  { name: 'Sex', value: 240 },
  { name: 'Sáb', value: 310 },
  { name: 'Dom', value: 280 },
];

// Coordenadas baseadas na região da Av. Paulista (São Paulo) para simulação
export const MOCK_STORES: Store[] = [
  {
    id: 's1',
    name: 'Burger King',
    category: 'Lanches',
    rating: 4.8,
    distance: '1.2km',
    status: 'open',
    address: 'Av. Paulista, 1230',
    imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=150&h=150&fit=crop',
    lat: -23.563, 
    lng: -46.654
  },
  {
    id: 's2',
    name: 'Sushi House',
    category: 'Japonesa',
    rating: 4.9,
    distance: '2.5km',
    status: 'busy',
    address: 'Rua Augusta, 500',
    imageUrl: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?w=150&h=150&fit=crop',
    lat: -23.558,
    lng: -46.660
  },
  {
    id: 's3',
    name: 'McDonalds',
    category: 'Lanches',
    rating: 4.5,
    distance: '3.0km',
    status: 'open',
    address: 'Shopping Center 3',
    imageUrl: 'https://images.unsplash.com/photo-1623341214823-b4846c8f23d9?w=150&h=150&fit=crop',
    lat: -23.559,
    lng: -46.658
  },
  {
    id: 's4',
    name: 'Pizza Hut',
    category: 'Pizza',
    rating: 4.7,
    distance: '0.8km',
    status: 'closed',
    address: 'Al. Santos, 800',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=150&h=150&fit=crop',
    lat: -23.565,
    lng: -46.652
  },
  {
    id: 's5',
    name: 'Açaí do Jota',
    category: 'Sobremesas',
    rating: 5.0,
    distance: '4.2km',
    status: 'open',
    address: 'Rua da Consolação, 100',
    imageUrl: 'https://images.unsplash.com/photo-1490474504059-bf68c43ef2dd?w=150&h=150&fit=crop',
    lat: -23.549,
    lng: -46.645
  }
];

export const MOCK_PENDING_DRIVERS: PendingDriver[] = [
  {
    id: 'd2',
    name: 'Fernanda Costa',
    cpf: '987.654.321-11',
    vehicle: 'Yamaha Fazer 250',
    plate: 'XYZ-9876',
    submittedAt: '2023-10-26T11:30:00',
    status: 'pending',
    documents: { 
      cnh: 'https://images.unsplash.com/photo-1589330694653-219286206aa3?w=600&auto=format&fit=crop&q=60', 
      crlv: 'https://images.unsplash.com/photo-1544396821-4dd40b938ad3?w=600&auto=format&fit=crop&q=60'
    }
  },
  {
    id: 'd3',
    name: 'Lucas Pereira',
    cpf: '456.789.123-22',
    vehicle: 'Bike Elétrica',
    plate: 'N/A',
    submittedAt: '2023-10-25T16:00:00',
    status: 'pending',
    documents: { 
      cnh: '', // Bike não precisa de CNH
      crlv: 'https://images.unsplash.com/photo-1517292987719-0369a794ec0f?w=600&auto=format&fit=crop&q=60' // RG
    } 
  }
];
