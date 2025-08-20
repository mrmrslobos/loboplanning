import React, { createContext, useContext, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { apiClient } from '../services/api';

interface User {
  id: string;
  username: string;
  familyId: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        const response = await apiClient.get('/auth/me');
        setUser(response.data.user);
      }
    } catch (error) {
      console.error('Auth loading error:', error);
      await SecureStore.deleteItemAsync('auth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/login', {
        username,
        password,
      });

      const { user, token } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const register = async (username: string, password: string) => {
    try {
      const response = await apiClient.post('/auth/register', {
        username,
        password,
      });

      const { user, token } = response.data;
      await SecureStore.setItemAsync('auth_token', token);
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('auth_token');
    delete apiClient.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}