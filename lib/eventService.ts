// lib/firebase/eventService.ts
import { db } from './config';
import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  Timestamp,
  getDoc,
  orderBy,
  limit
} from 'firebase/firestore';
import { Event } from '@/types';

const COLLECTION_NAME = 'events';

// Get event by ID
export const getEventById = async (eventId: string) => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, eventId);
    const eventSnap = await getDoc(eventRef);
    if (eventSnap.exists()) {
      return { id: eventSnap.id, ...eventSnap.data() } as Event;
    }
    return null;
  } catch (error) {
    console.error('Error getting event:', error);
    return null;
  }
};

// Subscribe to user's events with real-time updates
export const subscribeToEvents = (
  userId: string,
  callback: (events: Event[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('eventDate', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const events: Event[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventName: data.eventName || '',
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate || '',
        venue: data.venue || '',
        address: data.address || '',
        googleMaps: data.googleMaps || '',
        hostNames: data.hostNames || '',
        coupleNames: data.coupleNames || '',
        themeColor: data.themeColor || '#3B82F6',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.userId || userId
      } as Event);
    });
    callback(events);
  }, (error) => {
    console.error('Error subscribing to events:', error);
    callback([]);
  });
};

// Get all events for a user
export const getEventsByUser = async (userId: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      orderBy('eventDate', 'desc')
    );
    const snapshot = await getDocs(q);
    const events: Event[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventName: data.eventName || '',
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate || '',
        venue: data.venue || '',
        address: data.address || '',
        googleMaps: data.googleMaps || '',
        hostNames: data.hostNames || '',
        coupleNames: data.coupleNames || '',
        themeColor: data.themeColor || '#3B82F6',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.userId || userId
      } as Event);
    });
    return events;
  } catch (error) {
    console.error('Error getting events:', error);
    return [];
  }
};

// Create event - Updated to match your Event type
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...eventData,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error creating event:', error);
    return { success: false, error };
  }
};

// Update event
export const updateEvent = async (eventId: string, eventData: Partial<Event>) => {
  try {
    const eventRef = doc(db, COLLECTION_NAME, eventId);
    await updateDoc(eventRef, {
      ...eventData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, error };
  }
};

// Delete event
export const deleteEvent = async (eventId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, eventId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, error };
  }
};

// Get upcoming events (based on eventDate)
export const getUpcomingEvents = async (userId: string, limitCount: number = 5) => {
  try {
    const now = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('eventDate', '>=', now),
      orderBy('eventDate', 'asc'),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);
    const events: Event[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventName: data.eventName || '',
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate || '',
        venue: data.venue || '',
        address: data.address || '',
        googleMaps: data.googleMaps || '',
        hostNames: data.hostNames || '',
        coupleNames: data.coupleNames || '',
        themeColor: data.themeColor || '#3B82F6',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.userId || userId
      } as Event);
    });
    return events;
  } catch (error) {
    console.error('Error getting upcoming events:', error);
    return [];
  }
};

// Get events by type
export const getEventsByType = async (userId: string, eventType: Event['eventType']) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('eventType', '==', eventType),
      orderBy('eventDate', 'desc')
    );
    const snapshot = await getDocs(q);
    const events: Event[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventName: data.eventName || '',
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate || '',
        venue: data.venue || '',
        address: data.address || '',
        googleMaps: data.googleMaps || '',
        hostNames: data.hostNames || '',
        coupleNames: data.coupleNames || '',
        themeColor: data.themeColor || '#3B82F6',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.userId || userId
      } as Event);
    });
    return events;
  } catch (error) {
    console.error('Error getting events by type:', error);
    return [];
  }
};

// Get events by date range
export const getEventsByDateRange = async (userId: string, startDate: string, endDate: string) => {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('userId', '==', userId),
      where('eventDate', '>=', startDate),
      where('eventDate', '<=', endDate),
      orderBy('eventDate', 'asc')
    );
    const snapshot = await getDocs(q);
    const events: Event[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        eventName: data.eventName || '',
        eventType: data.eventType || 'Birthday',
        eventDate: data.eventDate || '',
        venue: data.venue || '',
        address: data.address || '',
        googleMaps: data.googleMaps || '',
        hostNames: data.hostNames || '',
        coupleNames: data.coupleNames || '',
        themeColor: data.themeColor || '#3B82F6',
        imageUrl: data.imageUrl || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString(),
        userId: data.userId || userId
      } as Event);
    });
    return events;
  } catch (error) {
    console.error('Error getting events by date range:', error);
    return [];
  }
};