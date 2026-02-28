'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { useAuth as useAuthProviderHook } from './provider';
import { useUser as useUserImpl } from './auth/use-user';

/**
 * Initializes Firebase services. Handles cases where the configuration might be missing
 * or invalid by returning undefined for services.
 */
export function initializeFirebase() {
  try {
    const isConfigValid = 
      firebaseConfig.apiKey && 
      firebaseConfig.apiKey !== 'undefined' && 
      firebaseConfig.apiKey.length > 10;

    if (!isConfigValid) {
      return { app: undefined, firestore: undefined, auth: undefined, storage: undefined };
    }

    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const firestore = getFirestore(app);
    const auth = getAuth(app);
    const storage = getStorage(app);

    return { app, firestore, auth, storage };
  } catch (error) {
    console.error("Firebase initialization failed:", error);
    return { 
      app: undefined, 
      firestore: undefined, 
      auth: undefined,
      storage: undefined
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
  const auth = useAuthProviderHook();
  return useUserImpl(auth);
}

/**
 * Hook to access the Firebase Storage instance.
 */
export function useStorage() {
  const { storage } = initializeFirebase();
  return storage;
}
