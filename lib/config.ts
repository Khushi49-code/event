// lib/config.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCH6DBdvDOgw71Os2AXxtZMB8f2nvBHSIU",
  authDomain: "event-ef782.firebaseapp.com",
  projectId: "event-ef782",
  storageBucket: "event-ef782.firebasestorage.app",
  messagingSenderId: "1075763847303",
  appId: "1:1075763847303:web:c3da6a1c5089c93e775822",
  measurementId: "G-D5VTYBZJ6L"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

export { app, db, storage, auth };