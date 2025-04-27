import React, { createContext, useContext, useEffect, useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTranslation } from '@/lib/i18n';

export type User = {
  id: number;
  username: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
  isVip: boolean;
  vipExpiresAt?: string;
  language?: 'en' | 'fr';
  preferredQuality?: string;
  createdAt: string;
};

type RegistrationData = {
  username: string;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  register: (data: RegistrationData) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isVip: boolean;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const refreshUser = async () => {
    try {
      const response = await fetch('/api/user', {
        credentials: 'include',
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Non authentifié, c'est normal, on ne fait rien
          setUser(null);
          return;
        }
        throw new Error('Failed to fetch user data');
      }
      
      const userData = await response.json();
      setUser(userData);
    } catch (err) {
      console.error('Error refreshing user:', err);
      // Ne pas définir d'erreur pour éviter d'afficher des messages d'erreur non nécessaires
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté au chargement
    refreshUser();
  }, []);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
        credentials: 'include',
      });
      
      if (!response.ok) {
        throw new Error('Login failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      toast({
        title: t('login'),
        description: `${t('welcome')}, ${userData.username}!`,
      });
    } catch (err) {
      setError('Invalid username or password');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegistrationData) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }
      
      const userData = await response.json();
      setUser(userData);
      toast({
        title: t('register'),
        description: `${t('welcome')}, ${userData.username}!`,
      });
    } catch (err: any) {
      setError(err.message || 'Registration failed');
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    
    try {
      await fetch('/api/logout', {
        method: 'POST',
        credentials: 'include',
      });
      
      setUser(null);
      toast({
        title: t('signOut'),
        description: t('signOutSuccess'),
      });
    } catch (err) {
      console.error('Logout error:', err);
      // Même si le logout échoue côté serveur, on déconnecte l'utilisateur localement
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    isVip: user?.isVip || false,
    refreshUser,
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