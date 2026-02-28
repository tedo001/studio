'use client';

import { useEffect, useState } from 'react';
import { Auth, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';

export function useUser(auth: Auth | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) return;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.error("Anonymous sign-in failed", error);
        });
      }
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth]);

  return { user, loading };
}
