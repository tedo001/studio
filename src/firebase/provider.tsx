'use client';

import React, { createContext, useContext } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseContextProps {
  app: FirebaseApp | undefined;
  firestore: Firestore | undefined;
  auth: Auth | undefined;
  storage: FirebaseStorage | undefined;
}

const FirebaseContext = createContext<FirebaseContextProps | undefined>(undefined);

export const FirebaseProvider: React.FC<{
  app: FirebaseApp | undefined;
  firestore: Firestore | undefined;
  auth: Auth | undefined;
  storage: FirebaseStorage | undefined;
  children: React.ReactNode;
}> = ({ app, firestore, auth, storage, children }) => {
  return (
    <FirebaseContext.Provider value={{ app, firestore, auth, storage }}>
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) throw new Error('useFirebase must be used within a FirebaseProvider');
  return context;
};

export const useFirebaseApp = () => useFirebase().app;
export const useFirestore = () => useFirebase().firestore;
export const useAuth = () => useFirebase().auth;
export const useStorage = () => useFirebase().storage;
