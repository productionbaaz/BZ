import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

/* ---- PASTE YOUR FIREBASE CONFIG HERE ----
   Firebase console → Project settings → General → "Your apps" → Web app
   → the `firebaseConfig` object. Paste its values below. */
const firebaseConfig = {
  apiKey: 'AIzaSyDN6o5J8cpn82iujikqEINxOIQbie59g0M',
  authDomain: 'bz-portal-5f7bc.firebaseapp.com',
  projectId: 'bz-portal-5f7bc',
  storageBucket: 'bz-portal-5f7bc.firebasestorage.app',
  messagingSenderId: '938906186015',
  appId: '1:938906186015:web:22efb6fe53a4c81927802a'
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

/* A second, separate Firebase app instance — used ONLY when a manager
   creates a new employee account. Firebase's client SDK automatically
   signs in as whichever account you just created, which would log the
   manager out of their own session if we used the primary app for
   this. Creating the account on this secondary instance instead keeps
   the manager's real session on `auth` untouched. */
const secondaryApp = getApps().find((a) => a.name === 'secondary')
  || initializeApp(firebaseConfig, 'secondary');
export const secondaryAuth = getAuth(secondaryApp);
