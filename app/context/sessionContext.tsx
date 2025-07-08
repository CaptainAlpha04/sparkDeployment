'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCookie } from '../utils/cookies';

interface User {
  name: string;
  email: string;
  admin: boolean;
  profilePic: string;
}

interface SessionContextType {
  isLogged: boolean;
  user: User | null;
  refreshSession: () => void;
  logout: () => void;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

async function fetchUserData(sessionId: string) {
  try {
    const response = await fetch('/api/checkSession', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user data');
    }

    const data = await response.json();
    return data.authenticated ? data.userData : null;
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export const SessionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isLogged, setIsLogged] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const refreshSession = async () => {
    const cookies = document.cookie;
    const sessionId = getCookie('sessionId', cookies);

    if (sessionId) {
      const userData = await fetchUserData(sessionId);
      if (userData) {
        setIsLogged(true);
        setUser({
          name: userData.name,
          email: userData.email,
          admin: userData.admin,
          profilePic: userData.profilePic || '/images/user.png',
        });
      } else {
        setIsLogged(false);
        setUser(null);
      }
    } else {
      setIsLogged(false);
      setUser(null);
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: getCookie('sessionId', document.cookie) }),
      });

      document.cookie = 'sessionId=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/';
      setIsLogged(false);
      setUser(null);
    } catch (error) {
      console.error('Error logging out', error);
    }
  };

  useEffect(() => {
    refreshSession();
  }, []);

  return (
    <SessionContext.Provider value={{ isLogged, user, refreshSession, logout }}>
      {children}
    </SessionContext.Provider>
  );
};