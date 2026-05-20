'use client';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types';
import { authService } from '@/services/api.service';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, role?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        try {
          const res = await authService.me();
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        } catch (err) {
          console.error('Session verification failed:', err);
        }
      }
      setIsLoading(false);
    };
    verifySession();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authService.login({ email, password });
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const signup = async (name: string, email: string, password: string, role?: string) => {
    const res = await authService.signup({ name, email, password, role });
    const { user, token } = res.data.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setToken(token);
    setUser(user);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      user, token, login, signup, logout,
      isLoading, isAdmin: user?.role === 'ADMIN',
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
