import { create } from 'zustand';

export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Policy {
  id: string;
  type: 'auto' | 'home' | 'life' | 'health';
  policyNumber: string;
  premium: number;
  status: 'active' | 'pending' | 'expired';
  startDate: string;
  endDate: string;
  coverage: number;
}

export interface Quote {
  id: string;
  type: 'auto' | 'home' | 'life' | 'health';
  premium: number;
  coverage: number;
  createdAt: string;
  expiresAt: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface AppState {
  user: User | null;
  policies: Policy[];
  quotes: Quote[];
  isAuthenticated: boolean;
  
  // Actions
  login: (user: User) => void;
  logout: () => void;
  addPolicy: (policy: Policy) => void;
  addQuote: (quote: Quote) => void;
  updateQuoteStatus: (id: string, status: Quote['status']) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  policies: [],
  quotes: [],
  isAuthenticated: false,

  login: (user) => set({ user, isAuthenticated: true }),
  
  logout: () => set({ user: null, isAuthenticated: false, policies: [], quotes: [] }),
  
  addPolicy: (policy) => set((state) => ({ 
    policies: [...state.policies, policy] 
  })),
  
  addQuote: (quote) => set((state) => ({ 
    quotes: [...state.quotes, quote] 
  })),
  
  updateQuoteStatus: (id, status) => set((state) => ({
    quotes: state.quotes.map(q => q.id === id ? { ...q, status } : q)
  })),
}));
