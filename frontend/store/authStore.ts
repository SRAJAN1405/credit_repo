import { create } from 'zustand';

export type UserRole = 'borrower' | 'admin' | 'sales' | 'sanction' | 'disbursement' | 'collection';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  initAuth: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  setAuth: (user, token) => {
    localStorage.setItem('lms_token', token);
    localStorage.setItem('lms_user', JSON.stringify(user));
    set({ user, token, isLoading: false });
  },

  logout: () => {
    localStorage.removeItem('lms_token');
    localStorage.removeItem('lms_user');
    set({ user: null, token: null, isLoading: false });
  },

  initAuth: () => {
    const token = localStorage.getItem('lms_token');
    const userStr = localStorage.getItem('lms_user');
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr) as AuthUser;
        set({ user, token, isLoading: false });
      } catch {
        set({ user: null, token: null, isLoading: false });
      }
    } else {
      set({ user: null, token: null, isLoading: false });
    }
  },
}));
