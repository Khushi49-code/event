// providers/AuthProvider.tsx
"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '@/lib/config';
import { AuthProvider as MainAuthProvider, useAuth as useMainAuth } from '@/contexts/AuthContext';

// Token Context
const TokenContext = createContext<{ user: User | null; loading: boolean }>({
  user: null,
  loading: true,
});

function TokenProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; SameSite=Lax`;
        setUser(firebaseUser);
      } else {
        document.cookie = 'firebaseAuthToken=; path=/; max-age=0';
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <TokenContext.Provider value={{ user, loading }}>
      {children}
    </TokenContext.Provider>
  );
}

// Main AuthProvider - બંને providers ને combine કરો
export function AuthProvider({ children }: { children: ReactNode }) {
  return (
    <MainAuthProvider>
      <TokenProvider>
        {children}
      </TokenProvider>
    </MainAuthProvider>
  );
}

// useAuth - main auth context માંથી
export function useAuth() {
  return useMainAuth();
}