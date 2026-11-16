'use client';

import React, { createContext, useContext } from 'react';
import type { UserRole } from '@/types/roles';

export interface SessionUser {
  userId: string;
  name: string;
  role: UserRole;
  shopId: string | null;
}

const AuthContext = createContext<{ user: SessionUser | null }>({ user: null });

// The user comes from the signed session cookie, read on the server in the root layout.
// Nothing here is trusted for access control: proxy.ts and every API route check the cookie themselves.
export function AuthProvider({ user, children }: { user: SessionUser | null; children: React.ReactNode }) {
  return <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
