// hooks/useFirebase.ts
"use client";

import { useState, useEffect, useCallback } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  updateDoc,
  addDoc,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { db, storage } from '@/lib/config';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import toast from 'react-hot-toast';

// ---------- useEvents ----------
export interface EventDoc {
  id: string;
  eventName: string;
  eventType: string;
  eventDate: string;
  venue: string;
  address?: string;
  googleMaps?: string;
  hostNames?: string;
  coupleNames?: string;
  themeColor?: string;
  imageUrl?: string;
  description?: string;
  status?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export function useEvents() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventDoc[];
        setEvents(data);
        setLoading(false);
      },
      (err) => {
        console.error('useEvents error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const createEvent = useCallback(async (eventData: Omit<EventDoc, 'id'>) => {
    try {
      const eventsRef = collection(db, 'events');
      const dataToSave = {
        ...eventData,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: eventData.status || 'active'
      };
      const docRef = await addDoc(eventsRef, dataToSave);
      return docRef.id;
    } catch (error: any) {
      console.error('Error creating event:', error);
      throw new Error(error.message || 'Failed to create event');
    }
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    if (!id) throw new Error('Event ID is required');
    try {
      const eventRef = doc(db, 'events', id);
      const docSnap = await getDoc(eventRef);
      if (!docSnap.exists()) throw new Error('Event not found');
      await deleteDoc(eventRef);
      return true;
    } catch (error: any) {
      console.error('Error deleting event:', error);
      throw new Error(error.message || 'Failed to delete event');
    }
  }, []);

  const updateEvent = useCallback(async (id: string, eventData: Partial<EventDoc>) => {
    try {
      const eventRef = doc(db, 'events', id);
      const docSnap = await getDoc(eventRef);
      if (!docSnap.exists()) throw new Error('Event not found');
      await updateDoc(eventRef, {
        ...eventData,
        updatedAt: Timestamp.now()
      });
      return true;
    } catch (error: any) {
      console.error('Error updating event:', error);
      throw new Error(error.message || 'Failed to update event');
    }
  }, []);

  const getEvent = useCallback(async (id: string) => {
    try {
      const eventRef = doc(db, 'events', id);
      const docSnap = await getDoc(eventRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as EventDoc;
      }
      throw new Error('Event not found');
    } catch (error: any) {
      console.error('Error getting event:', error);
      throw new Error(error.message || 'Failed to get event');
    }
  }, []);

  const refreshEvents = useCallback(async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'events'), orderBy('eventDate', 'asc'));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventDoc[];
      setEvents(data);
      return data;
    } catch (error: any) {
      console.error('Error refreshing events:', error);
      throw new Error(error.message || 'Failed to refresh events');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    events,
    loading,
    error,
    createEvent,
    deleteEvent,
    updateEvent,
    getEvent,
    refreshEvents,
  };
}

// ---------- FIXED useFileUpload ----------
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const uploadFile = useCallback((file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Reset states
      setUploading(true);
      setProgress(0);
      setError(null);
      setDownloadURL(null);

      try {
        const storageRef = ref(storage, path);
        const uploadTask = uploadBytesResumable(storageRef, file);

        uploadTask.on(
          'state_changed',
          (snapshot) => {
            // Calculate progress
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
            console.log(`Upload progress: ${progress.toFixed(2)}%`);
          },
          (err) => {
            // Handle error
            console.error('Upload error:', err);
            setError(err.message);
            setUploading(false);
            reject(err);
          },
          async () => {
            // Handle successful upload
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
              console.log('Upload completed, URL:', url);
              setDownloadURL(url);
              setProgress(100);
              setUploading(false);
              resolve(url);
            } catch (err) {
              console.error('Error getting download URL:', err);
              setError('Failed to get download URL');
              setUploading(false);
              reject(err);
            }
          }
        );
      } catch (err) {
        console.error('Upload setup error:', err);
        setError('Failed to start upload');
        setUploading(false);
        reject(err);
      }
    });
  }, []);

  const resetUpload = useCallback(() => {
    setUploading(false);
    setProgress(0);
    setError(null);
    setDownloadURL(null);
  }, []);

  return { 
    uploadFile, 
    uploading, 
    progress, 
    error,
    downloadURL,
    resetUpload 
  };
}

// ---------- useAnalytics ----------
export interface AnalyticsStats {
  totalGuests: number;
  confirmed: number;
  pending: number;
  declined: number;
  hotelGuests: number;
  occupancy: number;
}

export function useAnalytics(eventId: string) {
  const [stats, setStats] = useState<AnalyticsStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!eventId) {
      setStats(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const guestsQuery = query(
        collection(db, 'guests'),
        where('eventId', '==', eventId)
      );
      const snapshot = await getDocs(guestsQuery);

      let confirmed = 0;
      let pending = 0;
      let declined = 0;
      let hotelGuests = 0;

      snapshot.forEach((doc) => {
        const data = doc.data();
        const status = data.rsvpStatus || 'pending';

        if (status === 'confirmed') confirmed++;
        else if (status === 'declined') declined++;
        else pending++;

        if (data.hotelRequired) hotelGuests++;
      });

      const totalGuests = snapshot.size;
      const occupancy = totalGuests > 0 ? (hotelGuests / totalGuests) * 100 : 0;

      setStats({
        totalGuests,
        confirmed,
        pending,
        declined,
        hotelGuests,
        occupancy,
      });
    } catch (err: any) {
      console.error('useAnalytics error:', err);
      setError(err.message);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  return { stats, loading, error, fetchStats };
}

// ---------- useRSVP ----------
export interface RSVPDoc {
  id: string;
  name?: string;
  email?: string;
  phone?: string;
  guests?: number;
  adults?: number;
  children?: number;
  status?: string;
  [key: string]: any;
}

export function useRSVP(eventId: string) {
  const [rsvps, setRsvps] = useState<RSVPDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setRsvps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'guests'), where('eventId', '==', eventId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as RSVPDoc[];
        setRsvps(data);
        setLoading(false);
      },
      (err) => {
        console.error('useRSVP error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const updateRSVP = useCallback(async (id: string, updates: Partial<RSVPDoc>) => {
    const docRef = doc(db, 'guests', id);
    await updateDoc(docRef, updates);
  }, []);

  return { rsvps, loading, error, updateRSVP };
}

// ---------- useAccommodations ----------
export interface AccommodationDoc {
  id: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  roomType?: string;
  hotelName?: string;
  roomNumber?: string;
  status?: string;
  [key: string]: any;
}

export function useAccommodations(eventId: string) {
  const [accommodations, setAccommodations] = useState<AccommodationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setAccommodations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'accommodations'), where('eventId', '==', eventId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as AccommodationDoc[];
        setAccommodations(data);
        setLoading(false);
      },
      (err) => {
        console.error('useAccommodations error:', err);
        setError(err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  const updateRoomAssignment = useCallback(async (id: string, updates: Partial<AccommodationDoc>) => {
    const docRef = doc(db, 'accommodations', id);
    await updateDoc(docRef, updates);
  }, []);

  const addAccommodation = useCallback(async (data: Partial<AccommodationDoc>) => {
    await addDoc(collection(db, 'accommodations'), data);
  }, []);

  return { accommodations, loading, error, updateRoomAssignment, addAccommodation };
}

// ---------- useGuests ----------
export interface GuestDoc {
  id: string;
  name?: string;
  mobile?: string;
  guests?: number;
  [key: string]: any;
}

export function useGuests(eventId: string) {
  const [guests, setGuests] = useState<GuestDoc[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchGuests = useCallback(async () => {
    if (!eventId) {
      setGuests([]);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'guests'), where('eventId', '==', eventId));
      const snapshot = await getDocs(q);
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as GuestDoc[];
      setGuests(data);
    } catch (err) {
      console.error('useGuests error:', err);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  return { guests, loading, fetchGuests };
}

// ---------- useWhatsApp ----------
export interface WhatsAppTemplate {
  id: string;
  name?: string;
  type?: string;
  content?: string;
  eventId?: string;
  [key: string]: any;
}

export function useWhatsApp() {
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = collection(db, 'whatsappTemplates');
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as WhatsAppTemplate[];
        setTemplates(data);
        setLoading(false);
      },
      (err) => {
        console.error('useWhatsApp templates error:', err);
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const saveTemplate = useCallback(async (data: Partial<WhatsAppTemplate>) => {
    await addDoc(collection(db, 'whatsappTemplates'), data);
  }, []);

  const logMessage = useCallback(async (data: Record<string, any>) => {
    await addDoc(collection(db, 'whatsappLogs'), {
      ...data,
      sentAt: new Date().toISOString(),
    });
  }, []);

  return { templates, loading, saveTemplate, logMessage };
}