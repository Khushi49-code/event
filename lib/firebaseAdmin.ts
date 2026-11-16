// FILE PATH: lib/firebaseAdmin.ts   (નવી ફાઇલ બનાવો)
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();

/** Reads "Authorization: Bearer <Firebase ID token>" and returns the verified uid. */
export async function getUidFromRequest(req: Request): Promise<string> {
  const header = req.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) throw new Error('Unauthorized');
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}