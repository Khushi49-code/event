// lib/firebase/guestService.ts
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
  orderBy
} from 'firebase/firestore';
import { Guest } from '@/types';

const COLLECTION_NAME = 'guests';

// Subscribe to guests for an event
export const subscribeToGuests = (
  eventId: string,
  callback: (guests: Guest[]) => void
) => {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('eventId', '==', eventId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const guests: Guest[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      guests.push({
        id: doc.id,
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        guests: data.guests || 0,
        adults: data.adults || 0,
        children: data.children || 0,
        hotel: data.hotel || false,
        status: data.status || 'Pending',
        eventId: data.eventId || eventId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      } as Guest);
    });
    callback(guests);
  }, (error) => {
    console.error('Error subscribing to guests:', error);
    callback([]);
  });
};

// Get guests by event
export const getGuestsByEvent = async (eventId: string) => {
  try {
    const q = query(collection(db, COLLECTION_NAME), where('eventId', '==', eventId));
    const snapshot = await getDocs(q);
    const guests: Guest[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      guests.push({
        id: doc.id,
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        guests: data.guests || 0,
        adults: data.adults || 0,
        children: data.children || 0,
        hotel: data.hotel || false,
        status: data.status || 'Pending',
        eventId: data.eventId || eventId,
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      } as Guest);
    });
    return guests;
  } catch (error) {
    console.error('Error getting guests:', error);
    return [];
  }
};

// Get guest statistics for an event
export const getGuestStatistics = async (eventId: string) => {
  try {
    const guests = await getGuestsByEvent(eventId);
    const total = guests.length;
    const confirmed = guests.filter(g => g.status === 'Confirmed').length;
    const pending = guests.filter(g => g.status === 'Pending').length;
    const declined = guests.filter(g => g.status === 'Declined').length;
    const hotelGuests = guests.filter(g => g.hotel === true).length;
    
    return {
      total,
      confirmed,
      pending,
      declined,
      hotelGuests,
      occupancy: total > 0 ? (hotelGuests / total) * 100 : 0,
      responseRate: total > 0 ? ((confirmed + declined) / total) * 100 : 0,
      confirmationRate: total > 0 ? (confirmed / total) * 100 : 0
    };
  } catch (error) {
    console.error('Error getting guest statistics:', error);
    return null;
  }
};

// Add a new guest
export const addGuest = async (guestData: Omit<Guest, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const now = new Date().toISOString();
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...guestData,
      createdAt: now,
      updatedAt: now
    });
    return { id: docRef.id, success: true };
  } catch (error) {
    console.error('Error adding guest:', error);
    return { success: false, error };
  }
};

// Update guest status
export const updateGuestStatus = async (guestId: string, status: 'Confirmed' | 'Pending' | 'Declined') => {
  try {
    const guestRef = doc(db, COLLECTION_NAME, guestId);
    await updateDoc(guestRef, {
      status,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating guest:', error);
    return { success: false, error };
  }
};

// Update guest
export const updateGuest = async (guestId: string, guestData: Partial<Guest>) => {
  try {
    const guestRef = doc(db, COLLECTION_NAME, guestId);
    await updateDoc(guestRef, {
      ...guestData,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating guest:', error);
    return { success: false, error };
  }
};

// Delete guest
export const deleteGuest = async (guestId: string) => {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, guestId));
    return { success: true };
  } catch (error) {
    console.error('Error deleting guest:', error);
    return { success: false, error };
  }
};

// Get guest by ID
export const getGuestById = async (guestId: string) => {
  try {
    const guestRef = doc(db, COLLECTION_NAME, guestId);
    const guestSnap = await getDoc(guestRef);
    if (guestSnap.exists()) {
      const data = guestSnap.data();
      return {
        id: guestSnap.id,
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        guests: data.guests || 0,
        adults: data.adults || 0,
        children: data.children || 0,
        hotel: data.hotel || false,
        status: data.status || 'Pending',
        eventId: data.eventId || '',
        createdAt: data.createdAt || new Date().toISOString(),
        updatedAt: data.updatedAt || new Date().toISOString()
      } as Guest;
    }
    return null;
  } catch (error) {
    console.error('Error getting guest:', error);
    return null;
  }
};