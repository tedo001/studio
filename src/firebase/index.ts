'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';
import { useAuth } from './provider';
import { useUser as useUserImpl } from './auth/use-user';

/**
 * Initializes Firebase services. Handles cases where the configuration might be missing
 * or invalid by catching errors during initialization.
 */
export function initializeFirebase() {
  try {
    // Check if we have a valid configuration before attempting initialization
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined' || firebaseConfig.apiKey.length < 10) {
      console.warn("Firebase API key is missing or invalid. Please connect your Firebase project in the console.");
      return { app: undefined, firestore: undefined, auth: undefined };
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);

    return { app, firestore, auth };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { 
      app: undefined as any, 
      firestore: undefined as any, 
      auth: undefined as any 
    };
  }
}

export * from './provider';
export { FirebaseClientProvider } from './client-provider';
export { useCollection } from './firestore/use-collection';
export { useDoc } from './firestore/use-doc';

/**
 * Standardized useUser hook that retrieves the auth instance from context.
 */
export function useUser() {
  const auth = useAuth();
  return useUserImpl(auth);
}
