'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type UserRole = 'ADMIN' | 'OWNER' | 'MANAGER' | 'STAFF' | null;

interface AuthContextType {
  isLoggedIn: boolean;
  userRole: UserRole;
  refreshAuth: () => void;
}

const AuthContext = createContext<AuthContextType>({
  isLoggedIn: false,
  userRole: null,
  refreshAuth: () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);

  const checkAuth = () => {
    try {
      const cookies = document.cookie.split(';');
      const sessionCookie = cookies.find((c) => c.trim().startsWith('msc_session='));
      const loggedInCookie = cookies.find((c) => c.trim().startsWith('msc_logged_in='));

      if (sessionCookie || loggedInCookie) {
        setIsLoggedIn(true);
        if (sessionCookie) {
          const value = decodeURIComponent(sessionCookie.split('=')[1]);
          // Handle case where cookie might be plain text or JSON
          try {
            const parsed = JSON.parse(value);
            if (parsed?.role) {
              setUserRole(String(parsed.role).toUpperCase() as UserRole);
              return;
            }
          } catch {
            // If it's not JSON, check if value itself is a role
            if (['ADMIN', 'OWNER', 'MANAGER', 'STAFF'].includes(value.toUpperCase())) {
              setUserRole(value.toUpperCase() as UserRole);
              return;
            }
          }
        }
        // Fallback role if logged in cookie exists but session parsing failed
        setUserRole('STAFF');
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } catch (err) {
      console.error('Failed to parse auth session:', err);
      setIsLoggedIn(false);
      setUserRole(null);
    }
  };

  useEffect(() => {
    checkAuth();
    // Listen to custom auth events
    window.addEventListener('msc-auth-change', checkAuth);
    
    // Check periodically or on window focus
    window.addEventListener('focus', checkAuth);

    return () => {
      window.removeEventListener('msc-auth-change', checkAuth);
      window.removeEventListener('focus', checkAuth);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ isLoggedIn, userRole, refreshAuth: checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);