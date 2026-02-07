'use client'

import { useState, useEffect } from 'react';
import { currentUser as serverCurrentUser} from "@clerk/nextjs/server";

export function useCurrentUser() {
  const [user, setUser] = useState<Awaited<ReturnType<typeof serverCurrentUser>> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchUser() {
      try {
        const u = await serverCurrentUser();
        if (isMounted) setUser(u);
      } catch (e) {
        console.error('Failed to fetch current user', e);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchUser();

    return () => {
      isMounted = false;
    };
  }, []);

  return { user, loading };
}