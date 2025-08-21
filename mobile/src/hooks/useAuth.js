import { useState, useEffect, createContext, useContext } from 'react';
import { apiClient } from '../services/api';
import { storage } from '../services/storageService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const token = await storage.getAuthToken();
      const storedUser = await storage.getUser();
      
      if (token && storedUser) {
        apiClient.setToken(token);
        setUser(storedUser);
        setIsAuthenticated(true);
        
        // Verify token is still valid
        try {
          const response = await apiClient.me();
          if (response.user) {
            setUser(response.user);
            await storage.setUser(response.user);
          }
        } catch (error) {
          console.log('Token validation failed, clearing auth');
          await clearAuth();
        }
      }
    } catch (error) {
      console.error('Auth loading error:', error);
      await clearAuth();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await apiClient.login(email, password);
      
      if (response.user && response.token) {
        await storage.setAuthToken(response.token);
        await storage.setUser(response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await apiClient.register(name, email, password);
      
      if (response.user && response.token) {
        await storage.setAuthToken(response.token);
        await storage.setUser(response.user);
        setUser(response.user);
        setIsAuthenticated(true);
        return { success: true };
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      await apiClient.logout();
      await clearAuth();
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      await clearAuth();
      return { success: false, error: error.message };
    }
  };

  const clearAuth = async () => {
    await storage.removeAuthToken();
    await storage.removeUser();
    apiClient.setToken(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const createFamily = async (name) => {
    try {
      const family = await apiClient.createFamily(name);
      // Refresh user data to get updated familyId
      const response = await apiClient.me();
      if (response.user) {
        setUser(response.user);
        await storage.setUser(response.user);
      }
      return { success: true, family };
    } catch (error) {
      console.error('Create family error:', error);
      return { success: false, error: error.message };
    }
  };

  const joinFamily = async (inviteCode) => {
    try {
      const result = await apiClient.joinFamily(inviteCode);
      // Refresh user data to get updated familyId
      const response = await apiClient.me();
      if (response.user) {
        setUser(response.user);
        await storage.setUser(response.user);
      }
      return { success: true, family: result };
    } catch (error) {
      console.error('Join family error:', error);
      return { success: false, error: error.message };
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    createFamily,
    joinFamily,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}