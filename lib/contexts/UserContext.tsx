"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { API_BASE_URL } from '../api';

interface User {
  id: string;
  email: string;
  name: string;
  picture: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export function UserProvider({ children }: UserProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  // 检查本地存储的登录状态
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch(`${API_BASE_URL}/api/auth/user`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success) {
              setUser(data.user);
            } else {
              // Token无效，清除本地存储
              localStorage.removeItem('auth_token');
            }
          } else {
            // 请求失败，清除本地存储
            localStorage.removeItem('auth_token');
          }
        }
      } catch (error) {
        console.error('检查认证状态失败:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthStatus();
  }, []);

  const login = (userData: User, token: string) => {
    setUser(userData);
    localStorage.setItem('auth_token', token);
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('auth_token');
  };

  const value: UserContextType = {
    user,
    setUser,
    isLoading,
    login,
    logout,
    isAuthenticated
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}