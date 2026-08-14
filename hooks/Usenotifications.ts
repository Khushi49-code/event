// hooks/useNotifications.ts
"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  doc,
  updateDoc,
  writeBatch,
  addDoc,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/config';
import { useAuth } from '@/providers/AuthProvider';

export interface NotificationDoc {
  id: string;
  userId: string;
  message: string;
  link?: string | null;
  read: boolean;
  createdAt: Timestamp | null;
}

// Turns a Firestore Timestamp into "5 minutes ago" style text.
export function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return 'Just now';
  const date = timestamp.toDate();
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'Just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  return date.toLocaleDateString();
}

/**
 * Real-time notifications for the current signed-in user.
 * Reads from a top-level "notifications" collection, where each doc has:
 *   { userId, message, link?, read, createdAt }
 */
export function useNotifications() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.uid) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(20)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const items = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        })) as NotificationDoc[];
        setNotifications(items);
        setLoading(false);
        setError(null);
      },
      (err) => {
        console.error('Error listening to notifications:', err);
        setError(err.message || 'Failed to load notifications');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user?.uid]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = useCallback(async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    const unread = notifications.filter((n) => !n.read);
    if (unread.length === 0) return;
    try {
      const batch = writeBatch(db);
      unread.forEach((n) => {
        batch.update(doc(db, 'notifications', n.id), { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  }, [notifications]);

  return { notifications, unreadCount, loading, error, markAsRead, markAllAsRead };
}

/**
 * Call this from anywhere a notification-worthy event happens — a new RSVP,
 * a guest import, a plan expiring soon, etc.
 *
 * Example (in the RSVP page's handleStatusUpdate, after a guest confirms):
 *   await createNotification(hostUserId, `${rsvp.name} confirmed their RSVP`, '/rsvp');
 *
 * `userId` should be whichever account should see the notification (e.g. the
 * event owner's uid) — it doesn't have to be the currently signed-in user.
 */
export async function createNotification(userId: string, message: string, link?: string) {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      message,
      link: link || null,
      read: false,
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.error('Error creating notification:', err);
  }
}