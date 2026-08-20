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
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { db, storage, auth } from '@/lib/config';
import { onAuthStateChanged } from 'firebase/auth';
import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import toast from 'react-hot-toast';

// ---------- Shared auth-ready gate ----------
function useAuthReady() {
  const [uid, setUid] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          await user.getIdToken(true);
        } catch (tokenError) {
          console.error('useAuthReady: error refreshing ID token:', tokenError);
        }
      }
      setUid(user?.uid || null);
      setAuthChecked(true);
    });
    return () => unsubAuth();
  }, []);

  return { uid, authChecked };
}

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
  // 🔥 NEW: set once the invitation for this event has actually gone out /
  // been downloaded. Used by the events list's Cancel/Delete action to
  // decide whether cancelling an Active event refunds its plan credit.
  invitationSharedAt?: any;
  invitationDownloadedAt?: any;
  createdBy?: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

function sortByEventDate(list: EventDoc[]): EventDoc[] {
  return [...list].sort((a, b) => {
    const aTime = a.eventDate ? new Date(a.eventDate).getTime() : 0;
    const bTime = b.eventDate ? new Date(b.eventDate).getTime() : 0;
    return aTime - bTime;
  });
}

export function useEvents() {
  const [events, setEvents] = useState<EventDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { uid, authChecked } = useAuthReady();

  useEffect(() => {
    if (!authChecked) return;

    if (!uid) {
      setEvents([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, 'events'), where('createdBy', '==', uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as EventDoc[];
        setEvents(sortByEventDate(data));
        setLoading(false);
      },
      async (err) => {
        console.error('useEvents onSnapshot ERROR:', err.code, err.message);
        setError(err.message);
        try {
          const snap = await getDocs(q);
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as EventDoc[];
          setEvents(sortByEventDate(data));
        } catch (fallbackErr: any) {
          console.error('useEvents fallback fetch also failed:', fallbackErr);
          toast.error('Could not load your events. Please refresh the page.');
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [uid, authChecked]);

  const createEvent = useCallback(async (eventData: Omit<EventDoc, 'id'>) => {
    try {
      if (!auth.currentUser) {
        throw new Error('You must be logged in to create an event');
      }
      const eventsRef = collection(db, 'events');
      const dataToSave = {
        ...eventData,
        createdBy: auth.currentUser.uid,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        status: eventData.status || 'draft',
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
    if (!auth.currentUser) {
      setEvents([]);
      return [];
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'events'), where('createdBy', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as EventDoc[];
      const sorted = sortByEventDate(data);
      setEvents(sorted);
      return sorted;
    } catch (error: any) {
      console.error('Error refreshing events:', error);
      throw new Error(error.message || 'Failed to refresh events');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔥 NEW: mark that this event's invitation has been shared (e.g. sent via
  // WhatsApp). Once set, cancelling this event while Active won't refund a
  // plan credit — see the Cancel/Delete logic on the events list page.
  const markInvitationShared = useCallback(async (id: string) => {
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        invitationSharedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error: any) {
      console.error('Error marking invitation shared:', error);
      throw new Error(error.message || 'Failed to update event');
    }
  }, []);

  // 🔥 NEW: mark that this event's invitation has been downloaded. Call this
  // from the invitation card's Download button.
  const markInvitationDownloaded = useCallback(async (id: string) => {
    try {
      const eventRef = doc(db, 'events', id);
      await updateDoc(eventRef, {
        invitationDownloadedAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return true;
    } catch (error: any) {
      console.error('Error marking invitation downloaded:', error);
      throw new Error(error.message || 'Failed to update event');
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
    markInvitationShared,
    markInvitationDownloaded,
  };
}

// ---------- useFileUpload ----------
export function useFileUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [downloadURL, setDownloadURL] = useState<string | null>(null);

  const uploadFile = useCallback((file: File, path: string): Promise<string> => {
    return new Promise((resolve, reject) => {
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
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setProgress(progress);
          },
          (err) => {
            console.error('Upload error:', err);
            setError(err.message);
            setUploading(false);
            reject(err);
          },
          async () => {
            try {
              const url = await getDownloadURL(uploadTask.snapshot.ref);
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

// ---------- useWeeklyTrend ----------
export interface WeeklyTrendPoint {
  name: string;
  confirmed: number;
  pending: number;
  declined: number;
}

export function useWeeklyTrend(eventId: string) {
  const [trend, setTrend] = useState<WeeklyTrendPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!eventId) {
      setTrend([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'guests'), where('eventId', '==', eventId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const days: { time: number; label: string }[] = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          d.setHours(0, 0, 0, 0);
          days.push({ time: d.getTime(), label: d.toLocaleDateString('en-US', { weekday: 'short' }) });
        }

        const buckets: WeeklyTrendPoint[] = days.map((d) => ({
          name: d.label,
          confirmed: 0,
          pending: 0,
          declined: 0,
        }));

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const createdAt: Timestamp | undefined = data.createdAt;
          if (!createdAt?.toDate) return;

          const created = createdAt.toDate();
          created.setHours(0, 0, 0, 0);
          const createdTime = created.getTime();

          const dayIndex = days.findIndex((d) => d.time === createdTime);
          if (dayIndex === -1) return;

          const status = data.rsvpStatus || 'pending';
          if (status === 'confirmed') buckets[dayIndex].confirmed++;
          else if (status === 'declined') buckets[dayIndex].declined++;
          else buckets[dayIndex].pending++;
        });

        setTrend(buckets);
        setLoading(false);
      },
      (err) => {
        console.error('useWeeklyTrend error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [eventId]);

  return { trend, loading };
}

// ---------- useEventsOverview ----------
export interface EventOverviewPoint {
  name: string;
  guests: number;
  confirmed: number;
  pending: number;
}

export function useEventsOverview(events: EventDoc[]) {
  const [overview, setOverview] = useState<EventOverviewPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!events.length) {
      setOverview([]);
      return;
    }

    setLoading(true);
    const unsubscribe = onSnapshot(
      collection(db, 'guests'),
      (snapshot) => {
        const counts: Record<string, { guests: number; confirmed: number; pending: number }> = {};

        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const eventId = data.eventId;
          if (!eventId) return;

          if (!counts[eventId]) {
            counts[eventId] = { guests: 0, confirmed: 0, pending: 0 };
          }
          counts[eventId].guests++;

          const status = data.rsvpStatus || 'pending';
          if (status === 'confirmed') counts[eventId].confirmed++;
          else if (status !== 'declined') counts[eventId].pending++;
        });

        const data = events.slice(0, 6).map((event) => ({
          name: event.eventName,
          guests: counts[event.id]?.guests || 0,
          confirmed: counts[event.id]?.confirmed || 0,
          pending: counts[event.id]?.pending || 0,
        }));

        setOverview(data);
        setLoading(false);
      },
      (err) => {
        console.error('useEventsOverview error:', err);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [events]);

  return { overview, loading };
}

// ---------- useRecentActivity ----------
export interface ActivityItem {
  id: string;
  user: string;
  action: string;
  time: string;
  status: string;
}

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

export function useRecentActivity(eventId: string, max: number = 5) {
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!eventId) {
      setActivity([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const q = query(
        collection(db, 'guests'),
        where('eventId', '==', eventId)
      );

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          let docs: Array<{ id: string; [key: string]: any }> = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));

          docs = docs.sort((a, b) => {
            const getDate = (item: any): Date => {
              if (item?.createdAt?.toDate) {
                return item.createdAt.toDate();
              }
              if (item?.createdAt?.seconds) {
                return new Date(item.createdAt.seconds * 1000);
              }
              if (typeof item?.createdAt === 'string') {
                return new Date(item.createdAt);
              }
              if (item?.createdAt instanceof Date) {
                return item.createdAt;
              }
              return new Date(0);
            };

            const dateA = getDate(a);
            const dateB = getDate(b);
            return dateB.getTime() - dateA.getTime();
          });

          docs = docs.slice(0, max);

          const items: ActivityItem[] = docs.map((doc) => {
            const data = doc;
            const status = data.rsvpStatus || 'pending';
            const createdAt: Timestamp | undefined = data.createdAt;

            let time = '';
            if (createdAt?.toDate) {
              time = timeAgo(createdAt.toDate());
            } else if (createdAt?.seconds) {
              time = timeAgo(new Date(createdAt.seconds * 1000));
            } else if (typeof createdAt === 'string') {
              time = timeAgo(new Date(createdAt));
            }

            let action = 'was added as a guest';
            let statusLabel = 'Added';
            if (status === 'confirmed') {
              action = 'confirmed attendance';
              statusLabel = 'Confirmed';
            } else if (status === 'declined') {
              action = 'declined invitation';
              statusLabel = 'Declined';
            } else if (status === 'pending') {
              statusLabel = 'Pending';
            }

            return {
              id: doc.id,
              user: data.name || 'Guest',
              action,
              time,
              status: statusLabel,
            };
          });

          setActivity(items);
          setLoading(false);
        },
        (err) => {
          console.error('useRecentActivity error:', err);
          setError(err.message);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (err: any) {
      console.error('useRecentActivity setup error:', err);
      setError(err.message);
      setLoading(false);
    }
  }, [eventId, max]);

  return { activity, loading, error };
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
  const { authChecked } = useAuthReady();

  useEffect(() => {
    if (!authChecked) return;

    if (!eventId) {
      setRsvps([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
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
      async (err) => {
        console.error('useRSVP onSnapshot ERROR:', err.code, err.message);
        setError(err.message);
        try {
          const snap = await getDocs(q);
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as RSVPDoc[];
          setRsvps(data);
        } catch (fallbackErr: any) {
          console.error('useRSVP fallback fetch also failed:', fallbackErr);
          toast.error('Could not load RSVPs. Please refresh the page.');
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [eventId, authChecked]);

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
  const { authChecked } = useAuthReady();

  useEffect(() => {
    if (!authChecked) return;

    if (!eventId) {
      setAccommodations([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
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
      async (err) => {
        console.error('useAccommodations error:', err.code, err.message);
        setError(err.message);
        try {
          const snap = await getDocs(q);
          const data = snap.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          })) as AccommodationDoc[];
          setAccommodations(data);
        } catch (fallbackErr) {
          console.error('useAccommodations fallback fetch also failed:', fallbackErr);
        } finally {
          setLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, [eventId, authChecked]);

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
  const { authChecked } = useAuthReady();

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
    if (!authChecked) return;
    fetchGuests();
  }, [fetchGuests, authChecked]);

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
    const q = query(collection(db, 'whatsappTemplates'), orderBy('createdAt', 'desc'));
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
    try {
      const docRef = await addDoc(collection(db, 'whatsappTemplates'), {
        ...data,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error saving template:', error);
      throw error;
    }
  }, []);

  const logMessage = useCallback(async (data: Record<string, any>) => {
    try {
      const docRef = await addDoc(collection(db, 'whatsappLogs'), {
        ...data,
        sentAt: data.sentAt || new Date().toISOString(),
        createdAt: Timestamp.now(),
        timestamp: Timestamp.now(),
        logId: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      });
      return docRef.id;
    } catch (error) {
      console.error('Error logging message:', error);
      throw error;
    }
  }, []);

  const checkDuplicateLog = useCallback(async (guestId: string, eventId: string, content: string) => {
    try {
      const q = query(
        collection(db, 'whatsappLogs'),
        where('guestId', '==', guestId),
        where('eventId', '==', eventId),
        where('content', '==', content),
        limit(1)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error('Error checking duplicate log:', error);
      return false;
    }
  }, []);

  return {
    templates,
    loading,
    saveTemplate,
    logMessage,
    checkDuplicateLog
  };
}