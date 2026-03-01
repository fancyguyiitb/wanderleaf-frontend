'use client';

import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/lib/store';
import { usePropertyStore } from '@/lib/store';
import { wishlistApi } from '@/lib/api';

/**
 * Fetches the user's wishlist from the backend when authenticated
 * and syncs it to the property store.
 */
export default function WishlistHydrator() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setFavorites = usePropertyStore((s) => s.setFavorites);
  const didFetch = useRef(false);

  useEffect(() => {
    if (!isAuthenticated) {
      didFetch.current = false;
      return;
    }
    if (didFetch.current) return;
    didFetch.current = true;

    wishlistApi
      .list()
      .then((listings) => {
        setFavorites(listings.map((l) => l.id));
      })
      .catch(() => {
        didFetch.current = false;
      });
  }, [isAuthenticated, setFavorites]);

  return null;
}
