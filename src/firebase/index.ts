'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import { firebaseConfig } from './config';
import { useAuth, useFirestore } from './provider';
import { useUser as useUserImpl } from './auth/use-user';

/**
 * Initializes Firebase services. Handles cases where the configuration might be missing
 * or invalid by returning undefined for services.
 */
export function initializeFirebase() {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === 'undefined' || firebaseConfig.apiKey.length < 10) {
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
      app: undefined as any, 
      firestore: undefined as any, 
      auth: undefined as any,
      storage: undefined as any
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

/**
 * Hook to access the Firebase Storage instance.
 */
export const useStorage = () => {
  const { app } = initializeFirebase();
  return app ? getStorage(app) : undefined;
};
