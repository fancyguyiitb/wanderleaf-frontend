'use client';

import { useEffect, useState, useCallback } from 'react';
import { messagingApi } from './api';
import { useAuthStore } from './store';

export function useUnreadCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const authReady = useAuthStore((s) => s.authReady);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    if (!authReady || !isAuthenticated) return;
    setIsLoading(true);
    try {
      const res = await messagingApi.getUnreadCount();
      setTotal(res.total);
    } catch {
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [authReady, isAuthenticated]);

  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  useEffect(() => {
    if (!authReady || !isAuthenticated) return;
    const handler = () => fetchCount();
    window.addEventListener('inbox-update', handler);
    return () => window.removeEventListener('inbox-update', handler);
  }, [authReady, isAuthenticated, fetchCount]);

  return { total, isLoading };
}
