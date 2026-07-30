// lib/firebase/services.ts
import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './config';

// Event Services
export const eventServices = {
  async createEvent(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'events'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  },

  async getEvents() {
    try {
      const eventsRef = collection(db, 'events');
      const q = query(eventsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting events:', error);
      throw error;
    }
  },

  async getEventById(id: string) {
    try {
      const docRef = doc(db, 'events', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error) {
      console.error('Error getting event:', error);
      throw error;
    }
  },

  async updateEvent(id: string, data: any) {
    try {
      const docRef = doc(db, 'events', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating event:', error);
      throw error;
    }
  },

  async deleteEvent(id: string) {
    try {
      const docRef = doc(db, 'events', id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error('Error deleting event:', error);
      throw error;
    }
  },
};

// Guest Services
export const guestServices = {
  async addGuest(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'guests'), {
        ...data,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error adding guest:', error);
      throw error;
    }
  },

  async getGuestsByEvent(eventId: string) {
    try {
      const guestsRef = collection(db, 'guests');
      const q = query(guestsRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting guests:', error);
      throw error;
    }
  },

  async updateGuestStatus(id: string, status: string) {
    try {
      const docRef = doc(db, 'guests', id);
      await updateDoc(docRef, {
        status,
        updatedAt: serverTimestamp(),
      });
      return { id, status };
    } catch (error) {
      console.error('Error updating guest status:', error);
      throw error;
    }
  },

  async deleteGuest(id: string) {
    try {
      const docRef = doc(db, 'guests', id);
      await deleteDoc(docRef);
      return id;
    } catch (error) {
      console.error('Error deleting guest:', error);
      throw error;
    }
  },
};

// RSVP Services
export const rsvpServices = {
  async submitRSVP(data: any) {
    try {
      const docRef = await addDoc(collection(db, 'rsvp'), {
        ...data,
        submittedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      return { id: docRef.id, ...data };
    } catch (error) {
      console.error('Error submitting RSVP:', error);
      throw error;
    }
  },

  async getRSVPByEvent(eventId: string) {
    try {
      const rsvpRef = collection(db, 'rsvp');
      const q = query(rsvpRef, where('eventId', '==', eventId));
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error getting RSVP:', error);
      throw error;
    }
  },

  async updateRSVP(id: string, data: any) {
    try {
      const docRef = doc(db, 'rsvp', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: serverTimestamp(),
      });
      return { id, ...data };
    } catch (error) {
      console.error('Error updating RSVP:', error);
      throw error;
    }
  },
};