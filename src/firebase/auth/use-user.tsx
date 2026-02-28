'use client';

import { useEffect, useState } from 'react';
import { Auth, onAuthStateChanged, User, signInAnonymously } from 'firebase/auth';

export function useUser(auth: Auth | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If auth is not provided (initialization failed), stop loading immediately
    if (!auth) {
      setLoading(false);
      return;
    }

    let isMounted = true;

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!isMounted) return;

      if (!currentUser) {
        signInAnonymously(auth).catch((error) => {
          console.warn("Anonymous sign-in failed. This is expected if it's not enabled in the Firebase Console.", error.message);
          if (isMounted) setLoading(false);
        });
      } else {
        setUser(currentUser);
        setLoading(false);
      }
    }, (error) => {
      console.error("Auth state change error:", error);
      if (isMounted) setLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [auth]);

  return { user, loading };
}
