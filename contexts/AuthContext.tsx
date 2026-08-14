// contexts/AuthContext.tsx
"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  onIdTokenChanged,
  User as FirebaseUser,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '@/lib/config';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

// User type
interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  planExpiryDate?: any;
  isActive?: boolean;
}

// Auth Context Type
interface AuthContextType {
  user: User | null;
  firebaseUser: FirebaseUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  registerWithoutLogin?: (name: string, email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
  userData: User | null;
  refreshUserData: () => Promise<void>;
}

// Create Context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState<User | null>(null);

  // ✅ Combine both: Auth State + Token Refresh
  useEffect(() => {
    // First: Listen for auth state changes
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      
      if (firebaseUser) {
        // 🔥 FIX: On a *restored* (persisted) session — i.e. a plain page
        // load/refresh, not an explicit login — Firebase Auth can fire this
        // callback with a valid user object *before* the underlying ID
        // token is fully synced with the Firestore SDK's token provider.
        // Firestore reads issued right after that (from useEvents,
        // usePlanExpiry, usePaymentPlans, etc.) can then silently return
        // empty results instead of an error, which is why data looked
        // fine after a manual login but blank after a refresh — even
        // though it's the exact same uid. Forcing a token refresh here,
        // and waiting for it, guarantees a valid token is attached before
        // any dependent Firestore query fires (those hooks all wait on
        // `loading`/`authLoading` from this context).
        try {
          await firebaseUser.getIdToken(true);
        } catch (tokenError) {
          console.error('Error refreshing ID token:', tokenError);
        }

        await fetchUserData(firebaseUser.uid);
        setUser({
          id: firebaseUser.uid,
          name: firebaseUser.displayName || '',
          email: firebaseUser.email || '',
        });
      } else {
        setUser(null);
        setUserData(null);
      }
      
      setLoading(false);
    });

    // Second: Listen for token changes (for middleware)
    const unsubscribeToken = onIdTokenChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        document.cookie = `firebaseAuthToken=${token}; path=/; max-age=3600; SameSite=Lax`;
      } else {
        document.cookie = 'firebaseAuthToken=; path=/; max-age=0';
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeToken();
    };
  }, []);

  // Fetch user data from Firestore
  const fetchUserData = async (uid: string) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const data = userDocSnap.data();
        setUserData({
          id: uid,
          name: data.name || '',
          email: data.email || '',
          role: data.role || 'user',
          createdAt: data.createdAt,
          planExpiryDate: data.planExpiryDate,
          isActive: data.isActive,
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  // Refresh user data
  const refreshUserData = async () => {
    if (firebaseUser) {
      await fetchUserData(firebaseUser.uid);
    }
  };

  // Login function
  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      setFirebaseUser(firebaseUser);
      setUser({
        id: firebaseUser.uid,
        name: firebaseUser.displayName || '',
        email: firebaseUser.email || '',
      });

      await fetchUserData(firebaseUser.uid);

      const idToken = await firebaseUser.getIdToken();
      document.cookie = `firebaseAuthToken=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      toast.success('Login successful!');
    } catch (error: any) {
      console.error('Login error:', error);
      
      switch (error.code) {
        case 'auth/user-not-found':
          toast.error('User not found. Please check your email.');
          break;
        case 'auth/wrong-password':
          toast.error('Incorrect password. Please try again.');
          break;
        case 'auth/invalid-email':
          toast.error('Invalid email address.');
          break;
        case 'auth/invalid-credential':
          toast.error('Invalid email or password.');
          break;
        case 'auth/too-many-requests':
          toast.error('Too many attempts. Please try again later.');
          break;
        case 'auth/network-request-failed':
          toast.error('Network error. Check your internet connection.');
          break;
        default:
          toast.error(`Login failed: ${error.message || 'Please try again.'}`);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register function
  const register = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: name,
      });

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: name,
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      setFirebaseUser(firebaseUser);
      setUser({
        id: firebaseUser.uid,
        name: name,
        email: email,
        role: 'user',
      });

      await fetchUserData(firebaseUser.uid);

      const idToken = await firebaseUser.getIdToken();
      document.cookie = `firebaseAuthToken=${idToken}; path=/; max-age=3600; SameSite=Lax`;

      toast.success('Account created successfully!');
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Please login.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address. Please check and try again.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register without auto-login
  const registerWithoutLogin = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      await updateProfile(firebaseUser, {
        displayName: name,
      });

      await setDoc(doc(db, 'users', firebaseUser.uid), {
        name: name,
        email: email,
        role: 'user',
        createdAt: new Date().toISOString(),
        isActive: true,
      });

      await signOut(auth);
      
      setFirebaseUser(null);
      setUser(null);
      setUserData(null);

      toast.success('Account created successfully! Please login.');
    } catch (error: any) {
      console.error('Register error:', error);
      
      if (error.code === 'auth/email-already-in-use') {
        toast.error('Email already in use. Please login.');
      } else if (error.code === 'auth/weak-password') {
        toast.error('Password is too weak. Please use a stronger password.');
      } else if (error.code === 'auth/invalid-email') {
        toast.error('Invalid email address. Please check and try again.');
      } else {
        toast.error('Registration failed. Please try again.');
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setFirebaseUser(null);
      setUserData(null);
      document.cookie = 'firebaseAuthToken=; path=/; max-age=0; SameSite=Lax';
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Error logging out');
    }
  };

  const isAdmin = userData?.role === 'admin' || userData?.role === 'super_admin';
  const isAuthenticated = !!user;

  const value = {
    user,
    firebaseUser,
    loading,
    login,
    logout,
    register,
    registerWithoutLogin,
    isAuthenticated,
    isAdmin,
    userData,
    refreshUserData,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ✅ Custom hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}