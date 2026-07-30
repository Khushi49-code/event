// providers/AuthProvider.tsx
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { onIdTokenChanged, User } from 'firebase/auth';
import { auth } from '@/lib/config';

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onIdTokenChanged fires on sign-in, sign-out, AND whenever Firebase
    // auto-refreshes the token (roughly every hour) — so this keeps the
    // 'firebaseAuthToken' cookie (read by middleware.ts) always in sync.
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
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}